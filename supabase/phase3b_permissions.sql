-- ============================================================
-- GoCost — Phase 3b SQL: ระบบสิทธิ์เข้าถึงหน้า/ฟีเจอร์ (รันต่อจาก phase3_notifications_users.sql)
-- ฟีเจอร์ใหม่ตามที่ตกลง — ไม่มีอยู่ในต้นฉบับ Code.js เลย (ของเดิมมีแค่คอลัมน์
-- page_permissions เปล่าๆ ที่ไม่เคยมี UI ให้แก้ไขจริง)
--
-- หลักการ:
-- - "role" (เซลล์/ผู้บริหาร/บัญชี) ยังอยู่เหมือนเดิม ใช้เป็นค่า default
-- - "page_permissions" (ใหม่) คือรายการหน้า/ฟีเจอร์ที่ user คนนั้นเข้าถึงได้จริง
--   ผู้ที่มี role = 'ผู้บริหาร' (แมปกับคำว่า "ADMIN" ที่คุณใช้ในบทสนทนา — ถ้าหมายถึง
--   role อื่น แจ้งกลับมาได้ จะแก้ mapping ให้) จะเข้าถึงได้ "ทุกหน้าเสมอ" โดยอัตโนมัติ
--   ไม่ขึ้นกับ page_permissions เพื่อกันการล็อกตัวเองออกจากระบบโดยไม่ตั้งใจ
-- - เฉพาะ role = 'ผู้บริหาร' เท่านั้นที่แก้ไข page_permissions ของคนอื่นได้
-- ============================================================

alter table users add column if not exists page_permissions jsonb not null default '[]'::jsonb;

-- ─────────────────────────────────────────────
-- has_page_permission — helper กลาง เรียกใช้ในทุก RPC ที่ต้องเช็คสิทธิ์
-- ─────────────────────────────────────────────
create or replace function has_page_permission(p_user_id text, p_page_key text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_role text;
  v_perms jsonb;
begin
  select role, page_permissions into v_role, v_perms from users where id = p_user_id;
  if v_role is null then return false; end if;
  if v_role = 'ผู้บริหาร' then return true; end if;
  return coalesce(v_perms, '[]'::jsonb) ? p_page_key;
end;
$$;

-- ─────────────────────────────────────────────
-- update_user_permissions — เปิด/ปิดสิทธิ์เข้าถึงหน้า/ฟีเจอร์ของ user คนหนึ่ง
-- เฉพาะ role 'ผู้บริหาร' เท่านั้นที่เรียกได้ (เช็ค role ตรงๆ ไม่ผ่าน has_page_permission
-- เพื่อกัน edge case ที่ role ผู้บริหาร ถูกลบสิทธิ์ตัวเองจนล็อกระบบ)
-- แจ้งเตือนไปหา user เป้าหมายพร้อมสรุปว่าได้/เสียสิทธิ์อะไรไปบ้าง
-- ─────────────────────────────────────────────
create or replace function update_user_permissions(
  p_target_user_id text,
  p_new_page_keys jsonb,
  p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_role text;
  v_old_perms jsonb;
  v_added text[];
  v_removed text[];
  v_message text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  if v_actor_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ Admin (role ผู้บริหาร) เท่านั้นที่แก้ไขสิทธิ์ผู้อื่นได้');
  end if;

  select page_permissions into v_old_perms from users where id = p_target_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบผู้ใช้นี้');
  end if;
  v_old_perms := coalesce(v_old_perms, '[]'::jsonb);

  select array_agg(v) into v_added
  from jsonb_array_elements_text(p_new_page_keys) v
  where not (v_old_perms ? v);

  select array_agg(v) into v_removed
  from jsonb_array_elements_text(v_old_perms) v
  where not (p_new_page_keys ? v);

  update users set page_permissions = p_new_page_keys where id = p_target_user_id;

  v_message := '';
  if v_added is not null and array_length(v_added, 1) > 0 then
    v_message := v_message || 'ได้รับสิทธิ์เข้าถึง: ' || array_to_string(v_added, ', ');
  end if;
  if v_removed is not null and array_length(v_removed, 1) > 0 then
    if v_message <> '' then v_message := v_message || ' | '; end if;
    v_message := v_message || 'ถูกปิดสิทธิ์: ' || array_to_string(v_removed, ', ');
  end if;
  if v_message = '' then
    v_message := 'สิทธิ์การเข้าถึงของคุณไม่มีการเปลี่ยนแปลง';
  end if;

  perform add_notification('', p_target_user_id, v_message, p_target_user_id);
  perform write_audit_log(p_actor_id, 'UPDATE_PERMISSIONS', 'User',
    format('แก้ไขสิทธิ์ของ %s — %s', p_target_user_id, v_message));

  return jsonb_build_object('success', true, 'message', 'บันทึกสิทธิ์การเข้าถึงสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_users — เพิ่ม page_permissions ในผลลัพธ์ (ยังไม่คืน password/hash เหมือนเดิม)
-- ต้อง drop ก่อนเพราะเปลี่ยน return signature จากเฟส 3 เดิม
-- ─────────────────────────────────────────────
drop function if exists get_users();
create or replace function get_users()
returns table (id text, role text, name text, full_name text, email text, page_permissions jsonb, created_at timestamptz)
language sql
security definer
as $$
  select id, role, name, full_name, email, page_permissions, created_at from users order by created_at desc;
$$;

-- ─────────────────────────────────────────────
-- save_user — เพิ่มการเช็คสิทธิ์ผู้เรียกฝั่ง server (ของเดิม/เฟส 3 เดิมไม่เคยเช็คเลย
-- เป็นช่องโหว่จริงที่พบระหว่างทำเฟสนี้ ถือโอกาสปิดไปด้วย) + กำหนด default
-- page_permissions ให้ user ใหม่ตาม role (แก้ไขทีหลังผ่านแผงสิทธิ์ได้เสมอ)
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select exists(select 1 from users where id = p_id) into v_exists;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ผู้บริหาร' then '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- delete_user — เพิ่มการเช็คสิทธิ์ผู้เรียกเช่นเดียวกับ save_user
-- ─────────────────────────────────────────────
create or replace function delete_user(p_user_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if p_user_id = p_actor_id then
    return jsonb_build_object('success', false, 'message', 'ไม่สามารถลบบัญชีของตัวเองได้');
  end if;

  delete from users where id = p_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบ User นี้');
  end if;
  perform write_audit_log(coalesce(p_actor_id, 'SYSTEM'), 'DELETE_USER', 'User', 'ลบ user: ' || p_user_id);
  return jsonb_build_object('success', true, 'message', format('ลบ User %s สำเร็จ', p_user_id));
end;
$$;

-- ─────────────────────────────────────────────
-- get_audit_logs / get_pending_requests — เดิม (เฟส 2-3) ไม่เช็คสิทธิ์ผู้เรียกเลย
-- เพิ่ม p_actor_id + has_page_permission เข้าไปตอนนี้ (breaking change ของ signature
-- เดิม จึงต้อง drop ก่อน create ใหม่)
-- ─────────────────────────────────────────────
drop function if exists get_audit_logs(int);
create or replace function get_audit_logs(p_actor_id text, p_limit int default 200)
returns setof audit_logs
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'audit-log') then
    raise exception 'คุณไม่มีสิทธิ์ดูบันทึกกิจกรรม';
  end if;
  return query select * from audit_logs order by "timestamp" desc limit p_limit;
end;
$$;

drop function if exists get_pending_requests();
create or replace function get_pending_requests(p_actor_id text)
returns setof pending_edits
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'pending-edits') then
    raise exception 'คุณไม่มีสิทธิ์ดูคำขออนุมัติ';
  end if;
  return query select * from pending_edits order by request_timestamp desc;
end;
$$;

-- ─────────────────────────────────────────────
-- approve_edit_record / approve_delete_record / reject_pending_record
-- เปลี่ยนจากเช็ค role = 'ผู้บริหาร' ตรงๆ เป็น has_page_permission(actor,'pending-edits')
-- ผลลัพธ์เหมือนเดิมทุกประการสำหรับ role ผู้บริหาร (เพราะ has_page_permission คืน true
-- ให้เสมอ) แต่ตอนนี้ Admin สามารถมอบสิทธิ์อนุมัติให้ role อื่นได้ผ่านแผงสิทธิ์ใหม่ด้วย
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

  delete from expense_records where doc_number = v_row.original_row_id;
  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอลบเอกสาร %s ได้รับการอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_DELETE', 'Pending_Edits', format('อนุมัติลบ: %s, docNo: %s', p_edit_id, v_row.original_row_id));

  return jsonb_build_object('success', true, 'message', 'อนุมัติการลบสำเร็จ');
end;
$$;

create or replace function reject_pending_record(p_edit_id text, p_admin_note text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row pending_edits%rowtype;
begin
  if not has_page_permission(p_actor_id, 'pending-edits') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ปฏิเสธคำขอ');
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
-- login_user — ขยายจากเฟส 1 เดิมให้คืน page_permissions มาด้วย เพื่อให้ frontend
-- กรองเมนูได้ทันทีหลัง login โดยไม่ต้องเรียก get_users เพิ่มอีกครั้ง
-- ─────────────────────────────────────────────
drop function if exists login_user(text, text);
create or replace function login_user(p_id text, p_password text)
returns table (id text, role text, name text, full_name text, email text, page_permissions jsonb)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.role, u.name, u.full_name, u.email, u.page_permissions
  from users u
  where u.id = p_id
    and u.password_hash = crypt(p_password, u.password_hash);
end;
$$;

-- ─────────────────────────────────────────────
-- ให้ user ที่มีอยู่แล้วก่อนหน้านี้ (สร้างตอนเฟส 1-3 ก่อนมีระบบสิทธิ์) ได้ page_permissions
-- ที่สมเหตุสมผลตาม role เดิมของแต่ละคน แทนที่จะเป็น [] ว่างเปล่า (ซึ่งจะทำให้ล็อกไม่เห็น
-- เมนูอะไรเลยหลังรัน migration นี้) — รันครั้งเดียวตอน migrate
-- ─────────────────────────────────────────────
update users set page_permissions = '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
where role = 'ผู้บริหาร' and page_permissions = '[]'::jsonb;

update users set page_permissions = '["dashboard","expense-entry","expense-history"]'::jsonb
where role <> 'ผู้บริหาร' and page_permissions = '[]'::jsonb;
