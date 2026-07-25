-- ============================================================
-- GoCost — Phase 4i: บันทึกกิจกรรม — filter เดือน/ปี, โชว์ชื่อเล่น, ADMIN แก้ไข/ลบได้
-- รันหลัง phase4h_workshop_restructure.sql
-- ============================================================

drop function if exists get_audit_logs(text, int);
create or replace function get_audit_logs(
  p_actor_id text, p_year int default null, p_month int default null, p_limit int default 500
)
returns table (
  log_id text, "timestamp" timestamptz, user_id text, user_name text,
  action text, module text, details text
)
language plpgsql
security definer
as $$
declare
  v_year int := p_year;
begin
  if not has_page_permission(p_actor_id, 'audit-log') then
    raise exception 'คุณไม่มีสิทธิ์ดูบันทึกกิจกรรม';
  end if;
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  return query
  select a.log_id, a."timestamp", a.user_id, u.name as user_name, a.action, a.module, a.details
  from audit_logs a
  left join users u on u.id = a.user_id
  where (v_year is null or extract(year from a."timestamp") = v_year)
    and (p_month is null or extract(month from a."timestamp") = p_month)
  order by a."timestamp" desc
  limit p_limit;
end;
$$;

-- ─────────────────────────────────────────────
-- edit_audit_log / delete_audit_log — เฉพาะ role ADMIN เท่านั้น (เช็ค role ตรงๆ
-- ไม่ผ่าน has_page_permission เพราะการแก้ไข/ลบหลักฐานกิจกรรมเป็นเรื่องละเอียดอ่อน
-- ไม่ควรมอบสิทธิ์ผ่านแผงสิทธิ์ทั่วไปได้ ต้องเป็น ADMIN ตัวจริงเท่านั้น)
-- ─────────────────────────────────────────────
create or replace function edit_audit_log(p_log_id text, p_new_details text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  if v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบันทึกกิจกรรมได้');
  end if;

  update audit_logs set details = p_new_details where log_id = p_log_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบบันทึกนี้');
  end if;

  -- บันทึกการแก้ไขนี้เองเป็น log ใหม่ เพื่อไม่ให้ประวัติการแก้ไข audit log หายไปเงียบๆ
  perform write_audit_log(p_actor_id, 'EDIT_AUDIT_LOG', 'Audit_Logs', format('แก้ไข log %s', p_log_id));

  return jsonb_build_object('success', true, 'message', 'แก้ไขบันทึกกิจกรรมสำเร็จ');
end;
$$;

create or replace function delete_audit_log(p_log_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  if v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ลบบันทึกกิจกรรมได้');
  end if;

  delete from audit_logs where log_id = p_log_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบบันทึกนี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_AUDIT_LOG', 'Audit_Logs', format('ลบ log %s', p_log_id));

  return jsonb_build_object('success', true, 'message', 'ลบบันทึกกิจกรรมสำเร็จ');
end;
$$;
