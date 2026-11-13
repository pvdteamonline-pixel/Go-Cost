begin;
do $test$
declare actor text; result jsonb; plan_id text; details jsonb; original jsonb; token uuid:=gen_random_uuid(); denied boolean; bad text; finance_count bigint; plan_count bigint; rowdata jsonb;
begin
 select id into actor from public.users where role='ADMIN' order by id limit 1;
 if actor is null then raise exception 'No admin available'; end if;
 select count(*) into finance_count from expense_records;
 select count(*) into plan_count from workshop_plans;
 assert jsonb_array_length(get_workshop_plans_v2(actor))=plan_count, 'Admin cannot read every submitted plan';
 details:=jsonb_build_object('event_type','Workshop','party_name','GC1 rollback test','end_date','2026-11-28','start_time','09:00','end_time','17:00','venue','QA venue','topic','QA topic','expected_attendees',30,'estimated_cost',8500,'expense_items',jsonb_build_array(jsonb_build_object('description','Travel','amount',1500)),'equipment','POS 2','expected_product_order_value',50000.25,'estimated_store_stock_value',120000.50);
 original:=details;
 result:=save_workshop_request_v2(null,null,'2026-11-27',details,actor,token);
 assert result->>'success'='true','Create failed';
 plan_id:=result->>'planId';
 select value into rowdata from jsonb_array_elements(get_workshop_plans_v2(actor)) where value->>'id'=plan_id;
 assert rowdata->'request_details'=original,'Eight fields or date range changed on read';
 assert rowdata->>'planned_date'='2026-11-27','Start date changed';
 assert rowdata->>'status'='pending_approval','Approval state changed unexpectedly';
 result:=save_workshop_request_v2(null,null,'2026-11-27',details,actor,token);
 assert result->>'planId'=plan_id,'Retry duplicated request';
 assert (select count(*) from workshop_plans)=plan_count+1,'Unexpected new records';
 details:=details||jsonb_build_object('end_date','2027-01-02');
 result:=save_workshop_request_v2(plan_id,null,'2026-12-30',details,actor,token);
 assert result->>'success'='true','Edit failed';
 assert (select request_details from workshop_plans where id=plan_id)=details,'Edit lost request fields';
 foreach bad in array array['2026-12-29','2027-02-30','invalid',''] loop
  denied:=false;
  begin
   perform save_workshop_request_v2(plan_id,null,'2026-12-30',details||jsonb_build_object('end_date',bad),actor,token);
  exception when others then denied:=true;
  end;
  assert denied,'Invalid end date accepted';
  assert (select request_details from workshop_plans where id=plan_id)=details,'Rejected save changed data';
 end loop;
 result:=save_workshop_request_v2(plan_id,null,'2026-12-30',original-'end_date',actor,token);
 assert result->>'success'='true','Legacy single-day request rejected';
 assert (select count(*) from expense_records)=finance_count,'Financial records changed';
end; $test$;
rollback;
select 'GC1 round trip, edit, retry, approval state, invalid dates, legacy compatibility, Admin access: PASS; test records rolled back' as result;
