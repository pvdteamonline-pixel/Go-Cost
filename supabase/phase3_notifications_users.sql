-- ============================================================
-- GoCost — Phase 3 SQL (รันต่อจาก phase2_workflow.sql)
-- พอร์ตจาก Code.js: getNotifications, markNotificationRead, addNotification (มีแล้ว),
-- getUsers, saveUser, deleteUser — พฤติกรรมเดิมทุกจุด "ยกเว้น" การเก็บรหัสผ่าน
-- ที่เปลี่ยนจาก plaintext (ของเดิม) เป็น bcrypt hash เสมอ (ดูหมายเหตุท้ายไฟล์)
-- ============================================================

-- ─────────────────────────────────────────────
-- get_notifications — พอร์ตจาก getNotifications(targetRole, targetUser) เดิม
-- คงพฤติกรรม matchUser เดิมไว้ทุกจุดรวมถึงบั๊กที่กล่าวถึงด้านบน (broadcast ไปทุกคน
-- เมื่อ target_user ว่าง) เพื่อให้ผลลัพธ์ตรงกับระบบเดิม 100%
-- ─────────────────────────────────────────────
create or replace function get_notifications(p_target_role text, p_target_user text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_notifs jsonb;
  v_unread int;
begin
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb),
         count(*) filter (where t.status = 0)
  into v_notifs, v_unread
  from (
    select notif_id, target_role, target_user, message, link_id, status, created_at
    from notifications
    where (p_target_role is null or target_role = p_target_role)
       or (p_target_user is null or target_user = p_target_user or target_user = '')
    order by created_at desc
    limit 50
  ) t;

  return jsonb_build_object('success', true, 'notifications', coalesce(v_notifs, '[]'::jsonb), 'unreadCount', coalesce(v_unread, 0));
end;
$$;

-- ─────────────────────────────────────────────
-- mark_notification_read — พอร์ตจาก markNotificationRead(notifId) เดิม
-- ─────────────────────────────────────────────
create or replace function mark_notification_read(p_notif_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  update notifications set status = 1 where notif_id = p_notif_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบ Notification นี้');
  end if;
  return jsonb_build_object('success', true);
end;
$$;

-- ─────────────────────────────────────────────
-- get_users — พอร์ตจาก getUsers() เดิม (ไม่คืน password/password_hash กลับไปเลย
-- ต่างจากของเดิมที่คืน column password ตรงๆ — เป็นการปรับปรุงด้านความปลอดภัยที่ตั้งใจ)
-- ─────────────────────────────────────────────
create or replace function get_users()
returns table (id text, role text, name text, full_name text, email text, created_at timestamptz)
language sql
security definer
as $$
  select id, role, name, full_name, email, created_at from users order by created_at desc;
$$;

-- ─────────────────────────────────────────────
-- save_user — พอร์ตจาก saveUser(userData) เดิม
-- ต่างจากเดิม 1 จุดโดยตั้งใจ: hash รหัสผ่านด้วย bcrypt ก่อนเก็บเสมอ
-- (ของเดิมเก็บ plaintext ตรงๆ — เป็นช่องโหว่ที่ไม่ควร port ตามมา)
-- p_password: ส่งมาเมื่อสร้างใหม่หรือต้องการเปลี่ยนรหัสผ่าน, ปล่อย null = ไม่เปลี่ยนรหัสผ่านเดิม
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
begin
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
    insert into users (id, password_hash, role, name, full_name, email)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''));
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- delete_user — พอร์ตจาก deleteUser(userId) เดิม
-- ─────────────────────────────────────────────
create or replace function delete_user(p_user_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  delete from users where id = p_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบ User นี้');
  end if;
  perform write_audit_log(coalesce(p_actor_id, 'SYSTEM'), 'DELETE_USER', 'User', 'ลบ user: ' || p_user_id);
  return jsonb_build_object('success', true, 'message', format('ลบ User %s สำเร็จ', p_user_id));
end;
$$;

-- ─────────────────────────────────────────────
-- get_audit_logs — เดิมไม่มี "getAuditLogs" ใน Code.js (Audit_Logs sheet เขียนได้
-- อย่างเดียวจาก UI เดิม ไม่มีหน้าดูย้อนหลัง) เพิ่มให้เป็นฟีเจอร์ใหม่ตามที่ตกลง
-- ไว้ในแผนเฟส 3 — ไม่ใช่การพอร์ต 1:1 เพราะของเดิมไม่มีฟังก์ชันนี้ให้พอร์ต
-- ─────────────────────────────────────────────
create or replace function get_audit_logs(p_limit int default 200)
returns setof audit_logs
language sql
security definer
as $$
  select * from audit_logs order by "timestamp" desc limit p_limit;
$$;

