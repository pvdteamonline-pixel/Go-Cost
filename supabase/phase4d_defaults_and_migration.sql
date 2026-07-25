-- ============================================================
-- GoCost — Phase 4d: default permissions สำหรับหน้า Workshop ใหม่ + backfill user เดิม
-- รันหลัง phase4b_workshop.sql (ต้องมี has_page_permission และตาราง users.page_permissions
-- จาก phase3b/3c อยู่ก่อนแล้ว)
-- ============================================================

-- ─────────────────────────────────────────────
-- save_user — อัปเดต default page_permissions ให้ตรงกับ role จริงที่ควรทำอะไรได้
-- (เซลล์ → workshop-plan, บัญชี → workshop-accounting, ผู้บริหาร → workshop-approve)
-- ไม่เปลี่ยน logic ส่วนอื่นของ save_user เลย นอกจาก case ของ v_default_perms
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
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan","workshop-approve","workshop-accounting"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","workshop-accounting"]'::jsonb
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
-- Backfill: เติมสิทธิ์หน้า Workshop ให้ user ที่มีอยู่แล้วก่อนเฟสนี้ตาม role ปัจจุบัน
-- (แค่ "เติม" ให้ ไม่ลบสิทธิ์อื่นที่มีอยู่แล้ว — ใช้ || สำหรับรวม jsonb array)
-- ─────────────────────────────────────────────
update users set page_permissions = page_permissions || '["workshop-approve"]'::jsonb
where role = 'ผู้บริหาร' and not (page_permissions ? 'workshop-approve');

update users set page_permissions = page_permissions || '["workshop-plan"]'::jsonb
where role = 'เซลล์' and not (page_permissions ? 'workshop-plan');

update users set page_permissions = page_permissions || '["workshop-accounting"]'::jsonb
where role = 'บัญชี' and not (page_permissions ? 'workshop-accounting');
