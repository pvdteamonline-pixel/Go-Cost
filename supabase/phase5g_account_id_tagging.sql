-- ============================================================
-- GoCost — Phase 5g: เชื่อมรายจ่ายจริงเข้ากับรหัสบัญชี (เลือกทางที่ 2 ตามที่ตกลง)
-- รันหลัง phase5f_account_groups_defaults.sql
--
-- เพิ่มช่อง "รหัสบัญชี" เป็นช่องบังคับกรอกในทุกรายการค่าใช้จ่าย (ทั้งตอนบันทึกใหม่
-- และตอนแก้ไข) เพื่อให้รายงานผู้บริหาร/รายงานภาษีดึงข้อมูลจริงมาแสดงได้ทันที
-- ไม่ต้องรอไฟล์ Express/Bluenote
-- ============================================================

alter table expense_records add column if not exists account_id bigint references accounts(id);
create index if not exists idx_expense_records_account_id on expense_records(account_id);

-- ─────────────────────────────────────────────
-- list_accounts_for_selection — รายชื่อรหัสบัญชีสำหรับ dropdown ตอนบันทึกค่าใช้จ่าย
-- (เปิดให้ทุกคนที่มีสิทธิ์ 'expense-entry' เรียกได้ ไม่ต้องมีสิทธิ์ 'accounts'
-- เพราะเป็นแค่การ "เลือกใช้" ไม่ใช่ "จัดการ")
-- ─────────────────────────────────────────────
create or replace function list_accounts_for_selection(p_actor_id text)
returns table (id bigint, code text, name text, category text)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'expense-entry') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายชื่อรหัสบัญชี';
  end if;

  return query select a.id, a.code, a.name, a.category from accounts a order by a.code;
end;
$$;

-- ─────────────────────────────────────────────
-- save_expense_record — เพิ่ม validation บังคับ accountId ต่อรายการ + insert account_id
-- ─────────────────────────────────────────────
create or replace function save_expense_record(
  p_store_name text,
  p_event_date date,
  p_attendees int,
  p_work_days int,
  p_internal_note text,
  p_created_by text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_doc_no text;
  v_item jsonb;
  v_seq int := 0;
  v_qty numeric;
  v_unit_price numeric;
  v_account_id bigint;
begin
  if p_store_name is null or trim(p_store_name) = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า / ชื่องาน');
  end if;
  if p_event_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่จัดงาน');
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    if coalesce(trim(v_item->>'mainCategory'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกหมวดหมู่หลัก', v_seq));
    end if;
    if coalesce(trim(v_item->>'detail'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกรายละเอียด', v_seq));
    end if;
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    if v_qty is null or v_qty <= 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: จำนวนต้องมากกว่า 0', v_seq));
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: ราคาต่อหน่วยไม่ถูกต้อง', v_seq));
    end if;
    v_account_id := nullif(v_item->>'accountId', '')::bigint;
    if v_account_id is null then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกรหัสบัญชี', v_seq));
    end if;
    if not exists (select 1 from accounts where id = v_account_id) then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: รหัสบัญชีไม่ถูกต้อง', v_seq));
    end if;
  end loop;

  v_doc_no := generate_document_number();
  v_seq := 0;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, created_by, account_id
    ) values (
      v_doc_no, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, '')), p_created_by, (v_item->>'accountId')::bigint
    );
  end loop;

  insert into audit_logs (log_id, user_id, action, module, details)
  values ('LOG' || (extract(epoch from clock_timestamp()) * 1000)::bigint, p_created_by,
          'สร้างเอกสาร: ' || v_doc_no, 'บันทึกค่าใช้จ่าย', v_doc_no);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ', 'docNo', v_doc_no, 'rowsSaved', v_seq);
end;
$$;

-- ─────────────────────────────────────────────
-- update_expense_record — เพิ่ม account_id เหมือนกัน (ไม่บังคับ validate ซ้ำที่นี่
-- เพราะฝั่ง frontend ผ่านฟอร์มเดียวกับตอนสร้างซึ่งบังคับเลือกอยู่แล้ว)
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
      main_category, detail, qty, unit, unit_price, remark, internal_note, account_id
    ) values (
      p_old_doc_number, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, '')), nullif(v_item->>'accountId', '')::bigint
    );
  end loop;

  return jsonb_build_object('success', true, 'docNo', p_old_doc_number, 'rowsSaved', v_seq);
end;
$$;

-- ─────────────────────────────────────────────
-- approve_edit_record — carry account_id ผ่าน edit-approval flow ด้วยเช่นกัน
-- ─────────────────────────────────────────────
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
  delete from expense_records where doc_number = v_row.original_row_id;
  for v_item in select * from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, account_id
    ) values (
      v_row.original_row_id, v_seq, trim(v_payload->>'storeName'), (v_payload->>'eventDate')::date,
      coalesce((v_payload->>'attendees')::int, 0), coalesce((v_payload->>'workDays')::int, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(v_payload->>'internalNote', '')), nullif(v_item->>'accountId', '')::bigint
    );
  end loop;

  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอแก้ไขเอกสาร %s ถูกอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_EDIT', 'Pending_Edits', 'อนุมัติแก้ไข: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติการแก้ไขสำเร็จ');
end;
$$;
