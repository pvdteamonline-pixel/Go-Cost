begin;
-- Integration assertions: all fixtures and notifications are rolled back.
do $test$
declare actor text; token uuid:=gen_random_uuid(); result jsonb; plan_id text; details jsonb;
 old_count bigint; old_finance bigint; rowdata jsonb; denied boolean; bad jsonb; typ text; store bigint;
begin
 select id into actor from users where role='ADMIN' order by id limit 1;
 if actor is null then raise exception 'No admin fixture available'; end if;
 select count(*) into old_count from workshop_plans;
 select count(*) into old_finance from expense_records;
 details:=jsonb_build_object('event_type','Workshop','party_name','QA Workshop rollback only','start_time','09:00','end_time','16:00','venue','QA location','topic','QA topic','expected_attendees',30,'estimated_cost',8500,'expense_items',jsonb_build_array(jsonb_build_object('description','Food','amount',3000),jsonb_build_object('description','Travel','amount',1500),jsonb_build_object('description','Materials','amount',4000)),'equipment','POS 2 units');
 result:=save_workshop_request_v2(null,null,'2026-11-12',details,actor,token);
 assert result->>'success'='true','Create failed';
 plan_id:=result->>'planId';
 assert (select count(*) from workshop_plans)=old_count+1,'Create count incorrect';
 result:=save_workshop_request_v2(null,null,'2026-11-12',details,actor,token);
 assert result->>'planId'=plan_id,'Retry duplicated request';
 assert (select count(*) from workshop_plans)=old_count+1,'Retry duplicated row';
 select value into rowdata from jsonb_array_elements(get_workshop_plans_v2(actor)) where value->>'id'=plan_id;
 assert rowdata->'request_details'=details,'Round trip details differ';
 assert rowdata->>'store_name'='QA Workshop rollback only','Manual name missing';
 assert exists(select 1 from get_workshop_plans(actor) where id=plan_id),'Legacy reader dropped manual party';
 assert exists(select 1 from jsonb_array_elements(get_operational_report(actor)->'workshops') where value->>'id'=plan_id),'Report dropped manual party';
 result:=approve_workshop_plan(plan_id,actor);
 assert result->>'success'='true','Approval failed';
 assert (select status from workshop_plans where id=plan_id)='awaiting_sales_data','Approval state incorrect';
 details:=details||'{"topic":"QA edited topic","equipment":"POS 3 units","expected_attendees":45}'::jsonb;
 result:=save_workshop_request_v2(plan_id,null,'2026-12-05',details,actor,token);
 assert result->>'success'='true','Edit failed';
 assert (select request_details from workshop_plans where id=plan_id)=details,'Edit lost details';
 assert (select status from workshop_plans where id=plan_id)='awaiting_sales_data','Edit changed existing workflow';
 assert (select planned_date from workshop_plans where id=plan_id)='2026-12-05'::date,'Date edit failed';
 foreach typ in array array['Workshop','ตั้งกอง','Training Partner','Training ศูนย์ฝึกอาชีพ'] loop
  perform validate_workshop_details(details||jsonb_build_object('event_type',typ));
 end loop;
 for bad in select value from jsonb_array_elements(jsonb_build_array(
  details||'{"estimated_cost":10}', details||'{"end_time":"08:00"}',
  details||'{"expected_attendees":1.5}',details||'{"expected_attendees":-1}',
  details||'{"estimated_cost":-1}',details||'{"event_type":"unknown"}',
  details||'{"party_name":""}',details||'{"venue":""}',details||'{"topic":""}',
  details||'{"expense_items":[{"description":"x","amount":-1}]}',
  details||'{"expense_items":[{"description":"","amount":1}]}',
  details||'{"expense_items":null}', details||'{"estimated_cost":1.123}'
 )) loop
  denied:=false;
  begin perform validate_workshop_details(bad); exception when others then denied:=true; end;
  assert denied,'Invalid input accepted';
 end loop;
 perform validate_workshop_details(details||'{"estimated_cost":0,"expense_items":[],"equipment":""}'::jsonb);
 denied:=false;
 begin perform save_workshop_request_v2(null,null,'2026-11-12',details,'__nonexistent_qa_actor__',gen_random_uuid()); exception when others then denied:=true; end;
 assert denied,'Unknown actor accepted';
 select id into store from stores order by id limit 1;
 if store is not null then
  result:=save_workshop_request_v2(plan_id,store,'2026-12-05',details,actor,token);
  assert result->>'success'='true','Store link failed';
  assert (select request_details->>'party_name' from workshop_plans where id=plan_id)=(select name from stores where id=store),'Store name mismatch';
  result:=save_workshop_request_v2(plan_id,null,'2026-12-05',details,actor,token);
 end if;
 result:=delete_workshop_plan(plan_id,actor);
 assert result->>'success'='true','Archive/delete failed';
 assert exists(select 1 from operational_document_archive where doc_number=plan_id and document_type='Workshop' and payload->'request_details'=details),'Archive lost details';
 assert exists(select 1 from jsonb_array_elements(get_operational_report(actor)->'archived') where value->>'doc_number'=plan_id),'Archived report missing';
 assert (select count(*) from workshop_plans)=old_count,'Final live count incorrect';
 assert (select count(*) from expense_records)=old_finance,'Financial rows changed';
end; $test$;
select 'PASS: create, retry, read, edit, approve, report, archive, 4 types, 13 invalid inputs, zero budget, unknown actor, linked store, financial invariants' as workshop_qa;
rollback;
