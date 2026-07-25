-- ============================================================
-- GoCost — Phase 5t: จัดการรายการที่นำเข้าแล้ว (ลบ/แก้ไข/เพิ่ม) ไม่ต้องอัปโหลดใหม่ทั้งไฟล์
-- รันหลัง phase5s_executive_monthly_report.sql
--
-- เดิมมีแค่ delete_trial_balance_period (ลบทั้งช่วงเวลา เฉพาะงบทดลอง) — ตอนนี้เพิ่ม
-- ความสามารถแบบละเอียดกว่าให้ทั้ง 2 ประเภทไฟล์ (pl_estimate และ trial_balance):
-- 1. delete_import_batch    — ลบทั้ง batch (1 ครั้งที่อัปโหลด)
-- 2. get_import_lines       — ดูรายการย่อยทุกบรรทัดที่นำเข้าไว้ (กรองปี+ประเภทไฟล์)
-- 3. update_import_line     — แก้ไขยอดของ 1 บรรทัด (พิมพ์ผิด/ตัวเลขเปลี่ยน)
-- 4. delete_import_line     — ลบแค่ 1 บรรทัด (ลบ batch ที่ว่างเปล่าตามไปด้วยอัตโนมัติ)
-- 5. add_import_line        — เพิ่มรายการใหม่ด้วยมือ (ไม่ต้องอัปโหลดไฟล์ใหม่ทั้งไฟล์)
-- ============================================================

create or replace function delete_import_batch(p_actor_id text, p_batch_id bigint)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_type text;
  v_count int;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบข้อมูลที่นำเข้า');
  end if;

  select batch_type into v_batch_type from account_import_batches where id = p_batch_id;
  if v_batch_type is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรายการนำเข้านี้');
  end if;

  select count(*) into v_count from account_import_lines where batch_id = p_batch_id;
  delete from account_import_batches where id = p_batch_id;

  perform write_audit_log(p_actor_id, 'DELETE_IMPORT_BATCH', 'AccountImport',
    format('ลบชุดนำเข้า id %s (%s) — %s รายการ', p_batch_id, v_batch_type, v_count));

  return jsonb_build_object('success', true, 'message', format('ลบสำเร็จ (%s รายการ)', v_count));
end;
$$;

create or replace function get_import_lines(p_actor_id text, p_batch_type text, p_year int)
returns table (
  line_id bigint, batch_id bigint, code text, account_name text,
  month int, amount numeric, file_name text, uploaded_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายการที่นำเข้า';
  end if;

  return query
  select l.id, l.batch_id, l.code, a.name, l.month, l.amount, b.file_name, b.uploaded_at
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  left join accounts a on a.id = l.account_id
  where b.batch_type = p_batch_type and b.year = p_year
  order by l.month nulls last, l.code;
end;
$$;

create or replace function update_import_line(p_actor_id text, p_line_id bigint, p_amount numeric)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_old numeric;
  v_code text;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขรายการที่นำเข้า');
  end if;
  if p_amount is null then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอด');
  end if;

  select amount, code into v_old, v_code from account_import_lines where id = p_line_id;
  if v_code is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรายการนี้');
  end if;

  update account_import_lines set amount = p_amount where id = p_line_id;

  perform write_audit_log(p_actor_id, 'EDIT_IMPORT_LINE', 'AccountImport',
    format('แก้ไขยอดรหัส %s: %s → %s (line id %s)', v_code, v_old, p_amount, p_line_id));

  return jsonb_build_object('success', true, 'message', 'แก้ไขยอดสำเร็จ');
end;
$$;

create or replace function delete_import_line(p_actor_id text, p_line_id bigint)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_id bigint;
  v_code text;
  v_remaining int;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบรายการที่นำเข้า');
  end if;

  select batch_id, code into v_batch_id, v_code from account_import_lines where id = p_line_id;
  if v_batch_id is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรายการนี้');
  end if;

  delete from account_import_lines where id = p_line_id;

  select count(*) into v_remaining from account_import_lines where batch_id = v_batch_id;
  if v_remaining = 0 then
    delete from account_import_batches where id = v_batch_id;
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_IMPORT_LINE', 'AccountImport', format('ลบรายการรหัส %s (line id %s)', v_code, p_line_id));

  return jsonb_build_object('success', true, 'message', 'ลบรายการสำเร็จ');
end;
$$;

create or replace function add_import_line(
  p_actor_id text, p_batch_type text, p_year int, p_code text, p_month int, p_amount numeric, p_description text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_account_id bigint;
  v_batch_id bigint;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์เพิ่มรายการนำเข้า');
  end if;
  if p_batch_type not in ('trial_balance', 'expense_file', 'pl_estimate') then
    return jsonb_build_object('success', false, 'message', 'ประเภทไฟล์ไม่ถูกต้อง');
  end if;

  select id into v_account_id from accounts where code = trim(coalesce(p_code, ''));
  if v_account_id is null then
    return jsonb_build_object('success', false, 'message', format('ไม่พบรหัสบัญชี %s ในผังบัญชี กรุณาเพิ่มที่หน้า "จัดการรหัสบัญชี" ก่อน', p_code));
  end if;
  if p_amount is null then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอด');
  end if;

  select id into v_batch_id from account_import_batches
  where batch_type = p_batch_type and year = p_year and file_name = '(เพิ่มด้วยมือ)'
  limit 1;

  if v_batch_id is null then
    insert into account_import_batches (batch_type, year, month, file_name, uploaded_by)
    values (p_batch_type, p_year, null, '(เพิ่มด้วยมือ)', p_actor_id)
    returning id into v_batch_id;
  end if;

  insert into account_import_lines (batch_id, account_id, code, amount, month, description)
  values (v_batch_id, v_account_id, trim(p_code), p_amount, p_month, nullif(trim(coalesce(p_description, '')), ''));

  perform write_audit_log(p_actor_id, 'ADD_IMPORT_LINE', 'AccountImport',
    format('เพิ่มรายการด้วยมือ: %s เดือน %s ยอด %s (ปี %s, %s)', p_code, coalesce(p_month::text,'-'), p_amount, p_year, p_batch_type));

  return jsonb_build_object('success', true, 'message', 'เพิ่มรายการสำเร็จ');
end;
$$;
