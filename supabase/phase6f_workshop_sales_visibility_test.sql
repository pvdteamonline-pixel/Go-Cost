-- Transactional fixtures use existing actors; no users, grants or business rows survive.
begin;
do $test$
declare sale_id text; admin_id text; own_id text:= 'QA-OWN-'||gen_random_uuid();
 other_id text:= 'QA-OTHER-'||gen_random_uuid(); result jsonb; expected bigint; denied boolean;
begin
 select id into sale_id from users where role='เซลล์'
  and has_page_permission(id,'workshop-plan-view') order by id limit 1;
 select id into admin_id from users where role='ADMIN' order by id limit 1;
 assert sale_id is not null and admin_id is not null, 'Need existing sales viewer and admin';
 insert into workshop_plans(id,planned_date,created_by,request_details)
 values (own_id,'2026-11-27',sale_id,'{"party_name":"QA own","end_date":"2026-11-28"}'),
        (other_id,'2026-11-27',admin_id,'{"party_name":"QA other","end_date":"2026-11-28"}');
 insert into operational_document_archive(document_type,doc_number,created_by,payload)
 values ('Workshop',own_id,sale_id,'{}'),('Workshop',other_id,admin_id,'{}');
 assert exists(select 1 from get_workshop_plans(sale_id) where id=own_id), 'Own request missing in v1';
 assert not exists(select 1 from get_workshop_plans(sale_id) where created_by<>sale_id), 'Foreign request visible in v1';
 result:=get_workshop_plans_v2(sale_id);
 assert exists(select 1 from jsonb_array_elements(result) where value->>'id'=own_id), 'Own request missing in v2';
 assert not exists(select 1 from jsonb_array_elements(result) where value->>'created_by'<>sale_id), 'Foreign request visible in v2';
 assert (select value->'request_details'->>'end_date' from jsonb_array_elements(result) where value->>'id'=own_id)='2026-11-28', 'Date range lost';
 result:=get_operational_report(sale_id);
 assert exists(select 1 from jsonb_array_elements(result->'workshops') where value->>'id'=own_id), 'Own report missing';
 assert not exists(select 1 from jsonb_array_elements(result->'workshops') where value->>'created_by'<>sale_id), 'Foreign report visible';
 assert exists(select 1 from jsonb_array_elements(result->'archived') where value->>'doc_number'=own_id), 'Own archive missing';
 assert not exists(select 1 from jsonb_array_elements(result->'archived') where value->>'document_type'='Workshop' and value->>'created_by'<>sale_id), 'Foreign archive visible';
 select count(*) into expected from workshop_plans;
 assert jsonb_array_length(get_workshop_plans_v2(admin_id))=expected, 'Admin lost access';
 result:=get_operational_report(admin_id);
 assert jsonb_array_length(result->'workshops')=expected, 'Admin report lost access';
 denied:=false;
 begin perform get_workshop_plans_v2('QA-NONEXISTENT-'||gen_random_uuid()); exception when others then denied:=true; end;
 assert denied,'Unknown actor accepted';
end; $test$;
rollback;
select 'PASS: sales own-only v1/v2/report/archive, Admin all plans, date range, unknown actor; fixtures rolled back' as result;
