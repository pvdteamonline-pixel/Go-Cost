-- GoCost Workshop request template v2. Apply after phase6_operational_documents.sql.
-- Adds request details without changing historical data or financial totals.
begin;
set local lock_timeout = '5s';
alter table public.workshop_plans add column if not exists request_details jsonb;
alter table public.workshop_plans add column if not exists request_token uuid;
alter table public.workshop_plans alter column store_id drop not null;
create unique index if not exists workshop_request_token_unique on public.workshop_plans(request_token) where request_token is not null;

create or replace function public.validate_workshop_details(p_details jsonb)
returns void language plpgsql set search_path=public,pg_temp as $$
declare item jsonb; total numeric:=0; budget numeric;
begin
 if jsonb_typeof(p_details) is distinct from 'object' then raise exception 'ข้อมูลคำขอไม่ถูกต้อง'; end if;
 if coalesce(p_details->>'event_type','') not in ('Workshop','ตั้งกอง','Training Partner','Training ศูนย์ฝึกอาชีพ') then raise exception 'กรุณาเลือกประเภทงาน'; end if;
 if length(trim(coalesce(p_details->>'party_name',''))) not between 1 and 300 then raise exception 'กรุณาระบุชื่อร้าน / ลูกค้า / สถาบัน ไม่เกิน 300 ตัวอักษร'; end if;
 if coalesce(p_details->>'start_time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or coalesce(p_details->>'end_time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or p_details->>'end_time' <= p_details->>'start_time' then raise exception 'เวลาสิ้นสุดต้องหลังเวลาเริ่มในวันเดียวกัน'; end if;
 if length(trim(coalesce(p_details->>'venue',''))) not between 1 and 1000 then raise exception 'กรุณาระบุสถานที่จัด'; end if;
 if length(trim(coalesce(p_details->>'topic',''))) not between 1 and 1000 then raise exception 'กรุณาระบุหัวข้ออบรม'; end if;
 if coalesce(p_details->>'expected_attendees','') !~ '^[0-9]{1,7}$' then raise exception 'จำนวนคนต้องเป็นจำนวนเต็ม'; end if;
 if (p_details->>'expected_attendees')::numeric not between 1 and 1000000 then raise exception 'จำนวนคนต้องอยู่ระหว่าง 1 ถึง 1,000,000'; end if;
 if coalesce(p_details->>'estimated_cost','') !~ '^[0-9]{1,9}([.][0-9]{1,2})?$' then raise exception 'ค่าใช้จ่ายต้องไม่ติดลบและมีทศนิยมไม่เกิน 2 ตำแหน่ง'; end if;
 budget:=(p_details->>'estimated_cost')::numeric;
 if jsonb_typeof(p_details->'expense_items') is distinct from 'array' then raise exception 'รายการค่าเบิกไม่ถูกต้อง'; end if;
 if jsonb_array_length(p_details->'expense_items')>100 then raise exception 'รายการค่าเบิกเกิน 100 รายการ'; end if;
 for item in select * from jsonb_array_elements(p_details->'expense_items') loop
  if jsonb_typeof(item) is distinct from 'object' or length(trim(coalesce(item->>'description',''))) not between 1 and 500 then raise exception 'กรุณาระบุชื่อรายการค่าเบิก'; end if;
  if coalesce(item->>'amount','') !~ '^[0-9]{1,9}([.][0-9]{1,2})?$' then raise exception 'จำนวนเงินค่าเบิกไม่ถูกต้อง'; end if;
  if (item->>'amount')::numeric<=0 then raise exception 'จำนวนเงินค่าเบิกต้องมากกว่า 0'; end if;
  total:=total+(item->>'amount')::numeric;
 end loop;
 if total>budget then raise exception 'ยอดรวมที่ขอเบิกต้องไม่เกินค่าใช้จ่ายที่คาดการณ์ในข้อ 6'; end if;
 if length(coalesce(p_details->>'equipment',''))>2000 then raise exception 'รายละเอียดอุปกรณ์เกิน 2,000 ตัวอักษร'; end if;
end; $$;

-- Keep the existing API signatures and permissions. Only adapt the store lookup
-- to also include explicitly named institutions/customers without a master store.
do $$
declare def text; fn text;
begin
 foreach fn in array array['get_workshop_plans','get_operational_report','delete_workshop_plan'] loop
  select pg_get_functiondef(p.oid) into def from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname=fn and pg_get_function_identity_arguments(p.oid)=case when fn='delete_workshop_plan' then 'p_plan_id text, p_actor_id text' else 'p_actor_id text' end;
  if def is null then raise exception 'Missing prerequisite function: %',fn; end if;
  if position('request_details' in def)=0 then
   if position('join stores s on s.id' in def)=0 then raise exception 'Unexpected store lookup in %',fn; end if;
   def:=replace(def,'join stores s on s.id','left join stores s on s.id');
   def:=replace(def,'s.name', 'coalesce(nullif(wp.request_details->>''party_name'',''''),s.name)');
   execute def;
  end if;
 end loop;
end; $$;

create or replace function public.get_workshop_plans_v2(p_actor_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('request_details',w.request_details,'assigned_sales_name',coalesce(p.assigned_sales_name,s.assigned_sales_name)) order by p.planned_date,p.id),'[]'::jsonb)
 into result from public.get_workshop_plans(p_actor_id) p join public.workshop_plans w on w.id=p.id left join public.stores s on s.id=w.store_id;
 return result;
end; $$;

create or replace function public.save_workshop_request_v2(
 p_plan_id text, p_store_id bigint, p_planned_date date, p_details jsonb, p_actor_id text, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_row workshop_plans%rowtype; v_id text; v_name text; v_details jsonb;
begin
 if p_actor_id is null or not exists(select 1 from users where id=p_actor_id) then raise exception 'ไม่พบผู้ใช้งาน'; end if;
 if p_plan_id is null then
  if not has_page_permission(p_actor_id,'workshop-plan-create') then raise exception 'คุณไม่มีสิทธิ์สร้างคำขอ Workshop'; end if;
  if p_request_id is null then raise exception 'ไม่พบรหัสคำขอ กรุณาลองใหม่'; end if;
  perform pg_advisory_xact_lock(hashtext('workshop-request'),hashtext(p_request_id::text));
  select * into v_row from workshop_plans where request_token=p_request_id;
  if found then
   if v_row.created_by<>p_actor_id then raise exception 'รหัสคำขอนี้ถูกใช้งานแล้ว'; end if;
   return jsonb_build_object('success',true,'planId',v_row.id,'message','บันทึกคำขอนี้แล้ว');
  end if;
 else
  select * into v_row from workshop_plans where id=p_plan_id for update;
  if not found then raise exception 'ไม่พบคำขอนี้'; end if;
  if not has_page_permission(p_actor_id,'workshop-plan-edit') then raise exception 'คุณไม่มีสิทธิ์แก้ไขคำขอ Workshop'; end if;
  if v_row.created_by<>p_actor_id and not exists(select 1 from users where id=p_actor_id and role='ADMIN') then raise exception 'คุณแก้ไขได้เฉพาะคำขอของตัวเองเท่านั้น'; end if;
 end if;
 if p_planned_date is null or not isfinite(p_planned_date) then raise exception 'กรุณาระบุวันที่จัดงาน'; end if;
 if p_store_id is not null then
  select name into v_name from stores where id=p_store_id;
  if not found then raise exception 'ไม่พบร้านค้านี้'; end if;
 else
  v_name:=trim(p_details->>'party_name');
 end if;
 v_details:=p_details||jsonb_build_object('party_name',v_name);
 perform validate_workshop_details(v_details);
 if p_plan_id is null then
  v_id:=generate_workshop_doc_number();
  insert into workshop_plans(id,store_id,planned_date,created_by,request_details,request_token)
  values(v_id,p_store_id,p_planned_date,p_actor_id,v_details,p_request_id);
  perform add_notification('','',format('%s เสนอคำขอ %s: %s วันที่ %s',p_actor_id,v_details->>'event_type',v_name,p_planned_date),v_id);
  perform write_audit_log(p_actor_id,'CREATE_WORKSHOP','Workshop_Plans',format('สร้างคำขอ %s (%s) พร้อมรายละเอียดจัดงาน',v_id,v_name));
 else
  v_id:=p_plan_id;
  update workshop_plans set store_id=p_store_id,planned_date=p_planned_date,request_details=v_details where id=v_id;
  perform write_audit_log(p_actor_id,'EDIT_WORKSHOP_REQUEST','Workshop_Plans',format('แก้ไขคำขอ %s: %s วันที่ %s',v_id,v_name,p_planned_date));
 end if;
 return jsonb_build_object('success',true,'planId',v_id,'message',case when p_plan_id is null then 'ส่งคำขอเรียบร้อย รอผู้มีสิทธิ์อนุมัติ' else 'บันทึกการแก้ไขคำขอเรียบร้อย' end);
end; $$;
notify pgrst, 'reload schema';
commit;
