-- ============================================================
-- GoCost — Phase 2 SQL (รันต่อจาก schema.sql)
-- พอร์ตจาก Code.js: getDashboardStats, getFilterOptions, updateRecord,
-- deleteRecord, requestEdit, requestDelete, approveEdit, approveDelete,
-- rejectPending, getPendingRequests — พฤติกรรมเดิมทุกจุดรวมถึงบั๊กที่มีอยู่แล้ว
-- (ดูหมายเหตุเรื่อง notification filter ท้ายไฟล์)
-- ============================================================

-- ─────────────────────────────────────────────
-- helper: audit log (พอร์ตจาก writeAuditLog เดิม)
-- ─────────────────────────────────────────────
create or replace function write_audit_log(p_user_id text, p_action text, p_module text, p_details text)
returns void
language sql
security definer
as $$
  insert into audit_logs (log_id, user_id, action, module, details)
  values ('LOG' || (extract(epoch from clock_timestamp()) * 1000)::bigint, p_user_id, p_action, p_module, p_details);
$$;

-- ─────────────────────────────────────────────
-- helper: add notification (พอร์ตจาก addNotification เดิม ตรงตัว)
-- หมายเหตุ: คงพฤติกรรมเดิมไว้ทั้งหมด รวมถึงการที่ target_user ว่าง
-- จะไปตรงเงื่อนไข matchUser ในฝั่งอ่าน (ดูใน get_notifications ที่จะเพิ่มเฟส 3)
-- ─────────────────────────────────────────────
create or replace function add_notification(p_target_role text, p_target_user text, p_message text, p_link_id text)
returns void
language sql
security definer
as $$
  insert into notifications (notif_id, target_role, target_user, message, link_id, status)
  values ('NTF' || (extract(epoch from clock_timestamp()) * 1000)::bigint,
          coalesce(p_target_role, ''), coalesce(p_target_user, ''), coalesce(p_message, ''), coalesce(p_link_id, ''), 0);
$$;

-- ─────────────────────────────────────────────
-- get_dashboard_stats — พอร์ตจาก getDashboardStats(filters) เดิม
-- filters: { year, month, category, detail, store } (ปี เป็น ค.ศ. หรือ พ.ศ. ก็ได้ เหมือนเดิม)
-- ─────────────────────────────────────────────
create or replace function get_dashboard_stats(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_category text := nullif(trim(p_filters->>'category'), '');
  v_detail text := nullif(trim(p_filters->>'detail'), '');
  v_store text := nullif(trim(p_filters->>'store'), '');
  v_total_expenses numeric := 0;
  v_by_category jsonb := '{}'::jsonb;
  v_by_month jsonb := '{}'::jsonb;
  v_doc_count int := 0;
  v_top_category text := '-';
  v_top_amount numeric := 0;
  r record;
  v_cat_amount numeric;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  for r in
    select doc_number, main_category, event_date,
           sum(total) as row_total
    from expense_records
    where (v_year is null or extract(year from event_date) = v_year)
      and (v_month is null or extract(month from event_date) = v_month)
      and (v_category is null or main_category = v_category)
      and (v_detail is null or detail = v_detail)
      and (v_store is null or store_name = v_store)
    group by doc_number, main_category, event_date
  loop
    v_total_expenses := v_total_expenses + coalesce(r.row_total, 0);
    v_cat_amount := coalesce((v_by_category->>r.main_category)::numeric, 0) + coalesce(r.row_total, 0);
    v_by_category := v_by_category || jsonb_build_object(r.main_category, v_cat_amount);
    if r.event_date is not null then
      v_by_month := v_by_month || jsonb_build_object(
        to_char(r.event_date, 'YYYY-MM'),
        coalesce((v_by_month->>to_char(r.event_date, 'YYYY-MM'))::numeric, 0) + coalesce(r.row_total, 0)
      );
    end if;
  end loop;

  select count(distinct doc_number) into v_doc_count
  from expense_records
  where (v_year is null or extract(year from event_date) = v_year)
    and (v_month is null or extract(month from event_date) = v_month)
    and (v_category is null or main_category = v_category)
    and (v_detail is null or detail = v_detail)
    and (v_store is null or store_name = v_store);

  select key, value::numeric into v_top_category, v_top_amount
  from jsonb_each_text(v_by_category)
  order by value::numeric desc
  limit 1;

  return jsonb_build_object(
    'success', true,
    'totalExpenses', v_total_expenses,
    'totalSpend', v_total_expenses,
    'docCount', v_doc_count,
    'avgPerDoc', case when v_doc_count > 0 then v_total_expenses / v_doc_count else 0 end,
    'topCategory', coalesce(v_top_category, '-'),
    'topCategoryAmount', coalesce(v_top_amount, 0),
    'byCategory', v_by_category,
    'byMonth', v_by_month
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_filter_options — พอร์ตจาก getFilterOptions() เดิม
-- ─────────────────────────────────────────────
create or replace function get_filter_options()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'success', true,
    'years', coalesce((select jsonb_agg(distinct extract(year from event_date)::int + 543 order by extract(year from event_date)::int + 543 desc) from expense_records), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(distinct main_category order by main_category) from expense_records), '[]'::jsonb),
    'details', coalesce((select jsonb_agg(distinct detail order by detail) from expense_records), '[]'::jsonb),
    'storeNames', coalesce((select jsonb_agg(distinct store_name order by store_name) from expense_records), '[]'::jsonb)
  );
$$;

-- ─────────────────────────────────────────────
-- delete_expense_record — พอร์ตจาก deleteRecord(docNo) เดิม
-- ─────────────────────────────────────────────
create or replace function delete_expense_record(p_doc_number text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  delete from expense_records where doc_number = p_doc_number;
  get diagnostics v_count = row_count;
  return jsonb_build_object('success', true, 'message', format('ลบเอกสาร %s สำเร็จ (%s รายการ)', p_doc_number, v_count), 'deleted', v_count);
end;
$$;

-- ─────────────────────────────────────────────
-- update_expense_record — พอร์ตจาก updateRecord(oldDocNo, payload) เดิม
-- (ลบของเก่าทิ้งแล้วเขียนใหม่ทับเลขที่เอกสารเดิม เหมือนต้นฉบับ)
-- ─────────────────────────────────────────────
create or replace function update_expense_record(
  p_old_doc_number text,
  p_store_name text,
  p_event_date date,
  p_attendees int,
  p_work_days int,
  p_internal_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item jsonb;
  v_seq int := 0;
begin
  delete from expense_records where doc_number = p_old_doc_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note
    ) values (
      p_old_doc_number, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, ''))
    );
  end loop;

  return jsonb_build_object('success', true, 'docNo', p_old_doc_number, 'rowsSaved', v_seq);
end;
$$;

-- ─────────────────────────────────────────────
-- request_delete_record — พอร์ตจาก requestDelete(docNo, requestedBy) เดิม
-- ─────────────────────────────────────────────
create or replace function request_delete_record(p_doc_number text, p_requested_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_edit_id text := 'EDT' || (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  insert into pending_edits (edit_id, original_sheet_name, original_row_id, requested_by, status)
  values (v_edit_id, 'บันทึกค่าใช้จ่าย', p_doc_number, p_requested_by, 'pending_delete');

  perform add_notification('Admin', '', format('%s ขอลบเอกสาร %s', p_requested_by, p_doc_number), p_doc_number);
  perform write_audit_log(p_requested_by, 'REQUEST_DELETE', 'Pending_Edits', 'ขอลบเอกสาร: ' || p_doc_number);

  return jsonb_build_object('success', true, 'editId', v_edit_id, 'message', 'ส่งคำขอลบเรียบร้อย รอ Admin อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- request_edit_record — พอร์ตจาก requestEdit(oldDocNo, newPayload, requestedBy) เดิม
-- ─────────────────────────────────────────────
create or replace function request_edit_record(p_old_doc_number text, p_new_payload jsonb, p_requested_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_edit_id text := 'EDT' || (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  insert into pending_edits (edit_id, original_sheet_name, original_row_id, requested_by, new_data_json, status)
  values (v_edit_id, 'บันทึกค่าใช้จ่าย', p_old_doc_number, p_requested_by, p_new_payload, 'pending_edit');

  perform add_notification('Admin', '', format('%s ขอแก้ไขเอกสาร %s', p_requested_by, p_old_doc_number), p_old_doc_number);
  perform write_audit_log(p_requested_by, 'REQUEST_EDIT', 'Pending_Edits', 'ขอแก้ไขเอกสาร: ' || p_old_doc_number);

  return jsonb_build_object('success', true, 'editId', v_edit_id, 'message', 'ส่งคำขอแก้ไขเรียบร้อย รอ Admin อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- approve_edit_record — พอร์ตจาก approveEdit(editId) เดิม
-- ใช้ advisory lock แทน LockService (กัน 2 admin กดพร้อมกัน)
-- เพิ่ม p_actor_id + เช็ค role ผู้บริหาร ก่อนอนุมัติ (ของเดิมพึ่งพาแค่ frontend ซ่อนปุ่ม
-- ซึ่งไม่ปลอดภัยพอสำหรับ RPC ที่เรียกตรงได้ — จึงเพิ่มการเช็คสิทธิ์ฝั่ง DB ให้)
-- ─────────────────────────────────────────────
create or replace function approve_edit_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role text;
  v_row pending_edits%rowtype;
  v_payload jsonb;
  v_item jsonb;
  v_seq int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  select role into v_role from users where id = p_actor_id;
  if v_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะผู้บริหารเท่านั้นที่อนุมัติได้');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_edit' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  v_payload := coalesce(v_row.new_data_json, '{}'::jsonb);
  delete from expense_records where doc_number = v_row.original_row_id;
  for v_item in select * from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note
    ) values (
      v_row.original_row_id, v_seq, trim(v_payload->>'storeName'), (v_payload->>'eventDate')::date,
      coalesce((v_payload->>'attendees')::int, 0), coalesce((v_payload->>'workDays')::int, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(v_payload->>'internalNote', ''))
    );
  end loop;

  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอแก้ไขเอกสาร %s ถูกอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_EDIT', 'Pending_Edits', 'อนุมัติแก้ไข: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติการแก้ไขสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- approve_delete_record — พอร์ตจาก approveDelete(editId) เดิม (+ เช็คสิทธิ์เช่นเดียวกัน)
-- ─────────────────────────────────────────────
create or replace function approve_delete_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role text;
  v_row pending_edits%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  select role into v_role from users where id = p_actor_id;
  if v_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะผู้บริหารเท่านั้นที่อนุมัติได้');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_delete' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  delete from expense_records where doc_number = v_row.original_row_id;
  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอลบเอกสาร %s ได้รับการอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_DELETE', 'Pending_Edits', format('อนุมัติลบ: %s, docNo: %s', p_edit_id, v_row.original_row_id));

  return jsonb_build_object('success', true, 'message', 'อนุมัติการลบสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- reject_pending_record — พอร์ตจาก rejectPending(editId, adminNote) เดิม
-- ─────────────────────────────────────────────
create or replace function reject_pending_record(p_edit_id text, p_admin_note text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role text;
  v_row pending_edits%rowtype;
begin
  select role into v_role from users where id = p_actor_id;
  if v_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะผู้บริหารเท่านั้นที่ปฏิเสธคำขอได้');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  update pending_edits set status = 'rejected', admin_note = coalesce(p_admin_note, ''), processed_at = now()
  where edit_id = p_edit_id;

  perform add_notification('', v_row.requested_by, format('คำขอสำหรับเอกสาร %s ถูกปฏิเสธ: %s', v_row.original_row_id, coalesce(p_admin_note, '-')), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'REJECT_PENDING', 'Pending_Edits', 'ปฏิเสธคำขอ: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'ปฏิเสธคำขอสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_pending_requests — พอร์ตจาก getPendingRequests() เดิม
-- ─────────────────────────────────────────────
create or replace function get_pending_requests()
returns setof pending_edits
language sql
security definer
as $$
  select * from pending_edits order by request_timestamp desc;
$$;

-- ============================================================
-- หมายเหตุที่ตั้งใจคงพฤติกรรมเดิมไว้ (ไม่ได้แก้เอง เพราะไม่ได้ถูกขอ):
-- ฟังก์ชัน get_notifications (เฟส 3) จะสืบทอด "บั๊ก" จาก getNotifications เดิม
-- ที่ target_user ว่าง (Admin broadcast) จะโชว์ให้ "ทุกคน" เห็นไม่ใช่แค่ role
-- ผู้บริหาร เพราะเงื่อนไข matchUser เดิมเป็น OR ที่หลวมเกินไป — ถ้าต้องการแก้จริง
-- ให้แจ้งเป็นงานแยกต่างหาก จะได้ไม่ปนกับการพอร์ตแบบ 1:1 รอบนี้
-- ============================================================
