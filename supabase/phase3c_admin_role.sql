-- ============================================================
-- GoCost — Phase 3c SQL (รันต่อจาก phase3b_permissions.sql)
-- แก้ไขตามที่คุยกัน: แยก role "ADMIN" ออกมาเป็น superuser เดี่ยวๆ ที่ทำได้ทุกอย่าง
-- เสมอ ส่วน "ผู้บริหาร" (และ role อื่นทั้งหมด) กลายเป็น role ธรรมดาที่ต้องรอ ADMIN
-- ตั้งค่า page_permissions ให้ก่อน ถึงจะเข้าถึงหน้า/ทำอะไรได้ — ไม่มี auto full-access
-- ให้ role ไหนอีกต่อไป (ต่างจาก phase3b เดิมที่ผู้บริหาร = auto full-access)
-- ============================================================

-- ─────────────────────────────────────────────
-- has_page_permission — เปลี่ยนจาก role='ผู้บริหาร' เป็น role='ADMIN' เท่านั้น
-- ที่ bypass การเช็คสิทธิ์ได้เสมอ role อื่นทั้งหมดต้องมี page_key อยู่ใน
-- page_permissions จริงๆ ถึงจะผ่าน (รวมถึง 'ผู้บริหาร' ด้วย)
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
  if v_role = 'ADMIN' then return true; end if;
  return coalesce(v_perms, '[]'::jsonb) ? p_page_key;
end;
$$;

-- ─────────────────────────────────────────────
-- update_user_permissions — เฉพาะ role 'ADMIN' เท่านั้นที่แก้ไขสิทธิ์คนอื่นได้
-- (เดิมเช็ค 'ผู้บริหาร' ในเฟส 3b — ตอนนี้เปลี่ยนเป็น 'ADMIN' ตามที่คุยกัน)
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
  if v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขสิทธิ์ผู้อื่นได้');
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
-- save_user — อัปเดต 2 จุด:
-- 1. default page_permissions ใหม่ตามโมเดล role ที่เปลี่ยนไป (ผู้บริหารไม่ auto
--    full-access อีกต่อไป ได้แค่ค่า default ที่พอทำงานอนุมัติได้ ต้องให้ ADMIN
--    เปิดเพิ่มเองถ้าต้องการหน้าอื่น)
-- 2. กันการยกระดับสิทธิ์ (privilege escalation): ถ้า p_role ที่จะตั้งคือ 'ADMIN'
--    ผู้เรียก (actor) ต้องมี role = 'ADMIN' เท่านั้น — ป้องกันกรณี ADMIN มอบสิทธิ์
--    หน้า "users" ให้ผู้บริหารไปช่วยจัดการพนักงาน แล้วผู้บริหารคนนั้นแอบสร้าง/
--    เลื่อนใครเป็น ADMIN เองโดยไม่ได้รับอนุญาต
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
  v_actor_role text;
  v_current_role text;
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

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  -- กันการยกระดับเป็น ADMIN โดยผู้ที่ไม่ใช่ ADMIN เอง (ทั้งสร้างใหม่และแก้ไขของเดิม)
  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

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
      when p_role = 'ADMIN' then '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
      when p_role = 'ผู้บริหาร' then '["dashboard","expense-entry","expense-history","pending-edits"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ============================================================
-- สร้างบัญชี ADMIN ตัวแรกให้เลย (แทนขั้นตอน manual เดิม) — ปลอดภัยที่จะรันซ้ำ
-- เพราะใช้ ON CONFLICT DO NOTHING: ถ้ามี user id 'ADMIN' อยู่แล้วจะข้ามไปเฉยๆ
-- ไม่เขียนทับรหัสผ่านเดิมโดยไม่ตั้งใจ
--
-- ⚠️ ID/Password ด้านล่าง (ADMIN / ADMIN1234) เดาง่ายมาก เหมาะแค่ตอนตั้งระบบ
-- ครั้งแรกเท่านั้น — เข้าไปเปลี่ยนรหัสผ่านทันทีผ่านหน้า "จัดการผู้ใช้งาน"
-- หลัง login ครั้งแรกก่อนใช้งานจริงกับข้อมูลจริง
-- ============================================================
insert into users (id, password_hash, role, name, full_name, email, page_permissions)
values (
  'ADMIN',
  crypt('ADMIN1234', gen_salt('bf')),
  'ADMIN',
  'Admin',
  'ผู้ดูแลระบบ',
  null,
  '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
)
on conflict (id) do nothing;

