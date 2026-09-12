-- GoCost operational documents upgrade. Apply after phase5g and phase4h.
-- Additive migration: does not update existing financial rows or accounting imports.
begin;
create table if not exists public.operational_document_archive (
 document_type text not null, doc_number text not null, store_name text, event_date date,
 created_by text, deleted_at timestamptz not null default now(), payload jsonb not null,
 primary key(document_type,doc_number)
);
alter table public.operational_document_archive enable row level security;
create table if not exists public.expense_save_requests (
 request_id uuid primary key, actor_id text not null references public.users(id),
 result jsonb not null, created_at timestamptz not null default now()
);
alter table public.expense_save_requests enable row level security;
create index if not exists idx_pending_edits_document_status on public.pending_edits(original_row_id,status);
create index if not exists idx_workshop_planned_date on public.workshop_plans(planned_date);

create or replace function public.validate_expense_payload(p_items jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare item jsonb; q numeric; p numeric;
begin
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)=0 then raise exception 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'; end if;
 for item in select * from jsonb_array_elements(p_items) loop
  if coalesce(trim(item->>'mainCategory'),'')='' or coalesce(trim(item->>'detail'),'')='' then raise exception 'กรุณาระบุประเภทและรายละเอียด'; end if;
  if coalesce(item->>'qty','') !~ '^[0-9]+(\.[0-9]+)?$' or coalesce(item->>'unitPrice','') !~ '^[0-9]+(\.[0-9]+)?$' then raise exception 'จำนวนหรือราคาไม่ถูกต้อง'; end if;
  q:=(item->>'qty')::numeric; p:=(item->>'unitPrice')::numeric;
  if q<=0 or p<0 then raise exception 'จำนวนต้องมากกว่า 0 และราคาต้องไม่ติดลบ'; end if;
  if nullif(item->>'accountId','') is not null and not exists(select 1 from accounts where id=(item->>'accountId')::bigint) then raise exception 'รหัสบัญชีไม่ถูกต้อง'; end if;
 end loop;
end; $$;

create or replace function public.get_operational_report(p_actor_id text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare expenses jsonb:='[]'; workshops jsonb:='[]'; requests jsonb:='[]'; archived jsonb:='[]'; can_expense boolean; can_workshop boolean;
begin
 can_expense:=has_page_permission(p_actor_id,'expense-history') or has_page_permission(p_actor_id,'expense-report');
 can_workshop:=has_page_permission(p_actor_id,'workshop-plan-view') or has_page_permission(p_actor_id,'workshop-approve');
 if not(can_expense or can_workshop) then raise exception 'คุณไม่มีสิทธิ์ดูรายงานนี้'; end if;
 if can_expense then
  select coalesce(jsonb_agg(to_jsonb(e) order by e.event_date desc,e.doc_number,e.seq),'[]') into expenses from expense_records e;
  select coalesce(jsonb_agg(to_jsonb(e)),'[]') into requests from (select original_row_id,status from pending_edits where status in ('pending_edit','pending_delete')) e;
 end if;
 if can_workshop then
  select coalesce(jsonb_agg(to_jsonb(w) order by w.planned_date desc),'[]') into workshops from
   (select wp.*,s.name as store_name from workshop_plans wp join stores s on s.id=wp.store_id
    where wp.created_by=p_actor_id or has_page_permission(p_actor_id,'workshop-approve')) w;
 end if;
 select coalesce(jsonb_agg(to_jsonb(a)),'[]') into archived from operational_document_archive a
 where (document_type='PV' and can_expense) or (document_type='Workshop' and can_workshop and (a.created_by=p_actor_id or has_page_permission(p_actor_id,'workshop-approve')));
 return jsonb_build_object('expenses',expenses,'workshops',workshops,'requests',requests,'archived',archived);
end; $$;

create or replace function public.save_expense_document_v2(
 p_store_name text,p_event_date date,p_attendees int,p_work_days int,p_internal_note text,p_created_by text,p_items jsonb,p_request_id uuid
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb; item jsonb; i int:=0;
begin
 if not has_page_permission(p_created_by,'expense-entry') then raise exception 'คุณไม่มีสิทธิ์บันทึกค่าใช้จ่าย'; end if;
 if p_request_id is null then raise exception 'ไม่พบรหัสการบันทึก'; end if;
 perform pg_advisory_xact_lock(hashtext(p_request_id::text));
 select r.result into result from expense_save_requests r where request_id=p_request_id and actor_id=p_created_by;
 if found then return result; end if;
 if coalesce(p_attendees,0)<0 or coalesce(p_work_days,0)<0 then raise exception 'จำนวนผู้เข้างานและวันทำงานต้องไม่ติดลบ'; end if;
 perform validate_expense_payload(p_items);
 result:=save_expense_record(p_store_name,p_event_date,p_attendees,p_work_days,p_internal_note,p_created_by,p_items);
 if not coalesce((result->>'success')::boolean,false) then return result; end if;
 for item in select * from jsonb_array_elements(p_items) loop
  i:=i+1;
  update expense_records set attachment_url=nullif(item->>'attachmentUrl','') where doc_number=result->>'docNo' and seq=i;
 end loop;
 insert into expense_save_requests(request_id,actor_id,result) values(p_request_id,p_created_by,result);
 return result;
end; $$;


create or replace function approve_edit_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row pending_edits%rowtype;
  v_payload jsonb;
  v_item jsonb;
  v_seq int := 0;
  v_original expense_records%rowtype;
  v_old_items jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  if not has_page_permission(p_actor_id, 'pending-edits') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติคำขอ');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_edit' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  v_payload := coalesce(v_row.new_data_json, '{}'::jsonb);
  perform pg_advisory_xact_lock(hashtext('gocost_document_' || v_row.original_row_id));
  perform validate_expense_payload(v_payload->'items');
  if coalesce(trim(v_payload->>'storeName'),'')='' or nullif(v_payload->>'eventDate','') is null then raise exception 'ข้อมูลร้านค้าหรือวันที่ไม่ครบ'; end if;
  if coalesce((v_payload->>'attendees')::int,0)<0 or coalesce((v_payload->>'workDays')::int,0)<0 then raise exception 'จำนวนต้องไม่ติดลบ'; end if;
  select * into v_original from expense_records where doc_number=v_row.original_row_id order by seq limit 1;
  if not found then raise exception 'ไม่พบเอกสารต้นฉบับ'; end if;
  select jsonb_agg(to_jsonb(e) order by seq) into v_old_items from expense_records e where doc_number=v_row.original_row_id;
  delete from expense_records where doc_number = v_row.original_row_id;
  for v_item in select * from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, account_id, attachment_url, created_by, created_at
    ) values (
      v_row.original_row_id, v_seq, trim(v_payload->>'storeName'), (v_payload->>'eventDate')::date,
      coalesce((v_payload->>'attendees')::int, 0), coalesce((v_payload->>'workDays')::int, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(v_payload->>'internalNote', '')), nullif(v_item->>'accountId', '')::bigint,
      case when v_item ? 'attachmentUrl' then nullif(v_item->>'attachmentUrl','') else v_old_items->(v_seq-1)->>'attachment_url' end, v_original.created_by, v_original.created_at
    );
  end loop;

  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอแก้ไขเอกสาร %s ถูกอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_EDIT', 'Pending_Edits', 'อนุมัติแก้ไข: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติการแก้ไขสำเร็จ');
end;
$$;

create or replace function request_edit_record(p_old_doc_number text, p_new_payload jsonb, p_requested_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_edit_id text := 'EDT' || gen_random_uuid()::text;
begin
  if not has_page_permission(p_requested_by,'expense-history') then raise exception 'คุณไม่มีสิทธิ์แก้ไข/ลบเอกสาร'; end if;
  perform pg_advisory_xact_lock(hashtext('gocost_document_' || p_old_doc_number));
  if not exists(select 1 from expense_records where doc_number=p_old_doc_number) then raise exception 'ไม่พบเอกสาร'; end if;
  if exists(select 1 from pending_edits where original_row_id=p_old_doc_number and status in ('pending_edit','pending_delete')) then raise exception 'เอกสารนี้มีคำขอรออนุมัติอยู่แล้ว'; end if;
  perform validate_expense_payload(p_new_payload->'items');
  insert into pending_edits (edit_id, original_sheet_name, original_row_id, requested_by, new_data_json, status)
  values (v_edit_id, 'บันทึกค่าใช้จ่าย', p_old_doc_number, p_requested_by, p_new_payload, 'pending_edit');

  perform add_notification('Admin', '', format('%s ขอแก้ไขเอกสาร %s', p_requested_by, p_old_doc_number), p_old_doc_number);
  perform write_audit_log(p_requested_by, 'REQUEST_EDIT', 'Pending_Edits', 'ขอแก้ไขเอกสาร: ' || p_old_doc_number);

  return jsonb_build_object('success', true, 'editId', v_edit_id, 'message', 'ส่งคำขอแก้ไขเรียบร้อย รอ Admin อนุมัติ');
end;
$$;

create or replace function request_delete_record(p_doc_number text, p_requested_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_edit_id text := 'EDT' || gen_random_uuid()::text;
begin
  if not has_page_permission(p_requested_by,'expense-history') then raise exception 'คุณไม่มีสิทธิ์แก้ไข/ลบเอกสาร'; end if;
  perform pg_advisory_xact_lock(hashtext('gocost_document_' || p_doc_number));
  if not exists(select 1 from expense_records where doc_number=p_doc_number) then raise exception 'ไม่พบเอกสาร'; end if;
  if exists(select 1 from pending_edits where original_row_id=p_doc_number and status in ('pending_edit','pending_delete')) then raise exception 'เอกสารนี้มีคำขอรออนุมัติอยู่แล้ว'; end if;
  insert into pending_edits (edit_id, original_sheet_name, original_row_id, requested_by, status)
  values (v_edit_id, 'บันทึกค่าใช้จ่าย', p_doc_number, p_requested_by, 'pending_delete');

  perform add_notification('Admin', '', format('%s ขอลบเอกสาร %s', p_requested_by, p_doc_number), p_doc_number);
  perform write_audit_log(p_requested_by, 'REQUEST_DELETE', 'Pending_Edits', 'ขอลบเอกสาร: ' || p_doc_number);

  return jsonb_build_object('success', true, 'editId', v_edit_id, 'message', 'ส่งคำขอลบเรียบร้อย รอ Admin อนุมัติ');
end;
$$;

create or replace function approve_delete_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row pending_edits%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  if not has_page_permission(p_actor_id, 'pending-edits') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติคำขอ');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_delete' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  perform pg_advisory_xact_lock(hashtext('gocost_document_' || v_row.original_row_id));
  insert into operational_document_archive(document_type,doc_number,store_name,event_date,created_by,payload)
  select 'PV',doc_number,min(store_name),min(event_date),min(created_by),jsonb_build_object('items',jsonb_agg(to_jsonb(e) order by seq)) from expense_records e where doc_number=v_row.original_row_id group by doc_number
  on conflict(document_type,doc_number) do nothing;
  delete from expense_records where doc_number = v_row.original_row_id;
  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอลบเอกสาร %s ได้รับการอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_DELETE', 'Pending_Edits', format('อนุมัติลบ: %s, docNo: %s', p_edit_id, v_row.original_row_id));

  return jsonb_build_object('success', true, 'message', 'อนุมัติการลบสำเร็จ');
end;
$$;

create or replace function delete_workshop_plan(p_plan_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-delete') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบคำขอ Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณลบได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  insert into operational_document_archive(document_type,doc_number,store_name,event_date,created_by,payload)
  select 'Workshop',wp.id,s.name,wp.planned_date,wp.created_by,to_jsonb(wp) from workshop_plans wp join stores s on s.id=wp.store_id where wp.id=p_plan_id
  on conflict(document_type,doc_number) do nothing;
  delete from workshop_plans where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'DELETE_WORKSHOP', 'Workshop_Plans', 'ลบคำขอ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'ลบคำขอ Workshop สำเร็จ');
end;
$$;

create or replace function public.generate_document_number() returns text language plpgsql set search_path=public,pg_temp as $$
 declare y text:=to_char(now(),'YYYY'); n bigint;
 begin
 perform pg_advisory_xact_lock(hashtext('gocost_PV_number_lock'));
 select coalesce(max(substring(doc from 7)::bigint),0)+1 into n from (
 select doc_number as doc from expense_records union all select doc_number from operational_document_archive
 union all select result->>'docNo' from expense_save_requests
 ) d where doc ~ ('^PV'||y||'[0-9]+$');
 if n>999999 then raise exception 'เลขเอกสารประจำปีเต็ม'; end if;
 return 'PV'||y||lpad(n::text,6,'0');
 end; $$;

create or replace function public.generate_workshop_doc_number() returns text language plpgsql set search_path=public,pg_temp as $$
 declare y text:=to_char(now(),'YYYY'); n bigint;
 begin
 perform pg_advisory_xact_lock(hashtext('gocost_IV_number_lock'));
 select coalesce(max(substring(doc from 7)::bigint),0)+1 into n from (
 select id as doc from workshop_plans union all select doc_number from operational_document_archive
 union all select result->>'docNo' from expense_save_requests
 ) d where doc ~ ('^IV'||y||'[0-9]+$');
 if n>999999 then raise exception 'เลขเอกสารประจำปีเต็ม'; end if;
 return 'IV'||y||lpad(n::text,6,'0');
 end; $$;

create or replace function write_audit_log(p_user_id text, p_action text, p_module text, p_details text)
returns void
language sql
security definer
as $$
  insert into audit_logs (log_id, user_id, action, module, details)
  values ('LOG' || gen_random_uuid()::text, p_user_id, p_action, p_module, p_details);
$$;

create or replace function add_notification(p_target_role text, p_target_user text, p_message text, p_link_id text)
returns void
language sql
security definer
as $$
  insert into notifications (notif_id, target_role, target_user, message, link_id, status)
  values ('NTF' || gen_random_uuid()::text,
          coalesce(p_target_role, ''), coalesce(p_target_user, ''), coalesce(p_message, ''), coalesce(p_link_id, ''), 0);
$$;

notify pgrst, 'reload schema';
commit;
