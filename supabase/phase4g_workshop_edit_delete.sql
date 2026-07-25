-- ============================================================
-- GoCost — Phase 4g: แก้ไข/ลบคำขอ Workshop (ของตัวเอง)
-- รันหลัง phase4f_fix_admin_permissions.sql
--
-- กติกาสิทธิ์: role ADMIN ทำได้เสมอ (ของใครก็ได้) ส่วน role อื่นต้องมีสิทธิ์
-- page key 'workshop-plan-edit' / 'workshop-plan-delete' *และ* ต้องเป็นเจ้าของ
-- คำขอนั้นเอง (created_by ตรงกับผู้เรียก) ถึงจะทำได้ — กันไม่ให้คนอื่นมาแก้/ลบ
-- คำขอของเพื่อนร่วมงานแม้จะมี permission เดียวกัน
--
-- ข้อจำกัดตามสถานะ (กันไม่ให้แก้/ลบเอกสารที่ผูกกับบัญชีจริงไปแล้ว):
--   แก้ไขข้อมูลร้าน/วันที่      → เฉพาะสถานะ pending_approval เท่านั้น
--   แก้ไขข้อมูลหลังงาน          → เฉพาะสถานะ awaiting_sales_data / pending_accounting
--   ลบคำขอทั้งใบ                → เฉพาะสถานะ pending_approval / rejected / awaiting_sales_data
--   (ห้ามแก้/ลบเมื่อสถานะ completed เด็ดขาด เพราะมีเอกสารบัญชีจริงผูกอยู่แล้ว)
-- ============================================================

create or replace function update_workshop_plan_request(
  p_plan_id text, p_store_id bigint, p_planned_date date, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
  v_store_name text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-edit') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขคำขอ Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณแก้ไขได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'แก้ไขได้เฉพาะคำขอที่ยังรออนุมัติเท่านั้น');
  end if;
  if p_store_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกร้านค้า');
  end if;
  if p_planned_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่วางแผนจัดงาน');
  end if;

  select name into v_store_name from stores where id = p_store_id;
  if v_store_name is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  update workshop_plans set store_id = p_store_id, planned_date = p_planned_date where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'EDIT_WORKSHOP_REQUEST', 'Workshop_Plans',
    format('แก้ไขคำขอ %s → ร้าน %s วันที่ %s', p_plan_id, v_store_name, p_planned_date));

  return jsonb_build_object('success', true, 'message', 'แก้ไขคำขอ Workshop สำเร็จ');
end;
$$;

create or replace function update_workshop_sales_data(
  p_plan_id text, p_attendees int, p_sales_push_amount numeric,
  p_workshop_sales_amount numeric, p_attachment_path text, p_actor_id text
)
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
    if not has_page_permission(p_actor_id, 'workshop-plan-edit') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขข้อมูล Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณแก้ไขได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  if v_row.status not in ('awaiting_sales_data', 'pending_accounting') then
    return jsonb_build_object('success', false, 'message', 'แก้ไขข้อมูลหลังงานได้เฉพาะช่วงก่อนบัญชีลงบัญชีเสร็จเท่านั้น');
  end if;
  if p_attendees is null or p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกจำนวนคนเข้างานให้ถูกต้อง');
  end if;
  if p_sales_push_amount is null or p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขายดันเข้าร้านค้าให้ถูกต้อง');
  end if;
  if p_workshop_sales_amount is null or p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขาย Workshop ให้ถูกต้อง');
  end if;

  update workshop_plans set
    attendees = p_attendees,
    sales_push_amount = p_sales_push_amount,
    workshop_sales_amount = p_workshop_sales_amount,
    attachment_path = case when p_attachment_path is null then attachment_path else nullif(p_attachment_path, '') end
  where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'EDIT_WORKSHOP_SALES_DATA', 'Workshop_Plans', 'แก้ไขข้อมูลหลังงาน: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'แก้ไขข้อมูลสำเร็จ');
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

  if v_row.status not in ('pending_approval', 'rejected', 'awaiting_sales_data') then
    return jsonb_build_object('success', false, 'message', 'ลบไม่ได้ — คำขอนี้เข้าสู่ขั้นตอนบัญชีแล้ว');
  end if;

  delete from workshop_plans where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'DELETE_WORKSHOP', 'Workshop_Plans', 'ลบคำขอ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'ลบคำขอ Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- backfill: ให้บัญชี ADMIN ทุกบัญชีมี key ใหม่ 2 ตัวนี้ในรายการด้วย (ADMIN bypass
-- อยู่แล้วจากการเช็ค role แต่เติมไว้ให้ checkbox ในหน้าแผงสิทธิ์แสดงติ๊กครบถูกต้อง)
-- ─────────────────────────────────────────────
update users set page_permissions = page_permissions || '["workshop-plan-edit","workshop-plan-delete"]'::jsonb
where role = 'ADMIN'
  and not (page_permissions ? 'workshop-plan-edit' and page_permissions ? 'workshop-plan-delete');

-- ─────────────────────────────────────────────
-- default permission: เพิ่ม 2 key ใหม่ให้ role 'เซลล์' โดย default เช่นเดียวกับ
-- 'workshop-plan' เดิม (เป็นฟีเจอร์ของตัวเองอยู่แล้ว) — role อื่นไม่ default ให้
-- ต้องให้ ADMIN มอบสิทธิ์เองถ้าต้องการ
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
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan","workshop-plan-edit","workshop-plan-delete","workshop-approve","workshop-accounting","stores"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan","workshop-plan-edit","workshop-plan-delete"]'::jsonb
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

-- backfill: ให้บัญชี role 'เซลล์' ที่มีอยู่แล้วได้สิทธิ์แก้ไข/ลบคำขอของตัวเองด้วย
update users set page_permissions = page_permissions || '["workshop-plan-edit","workshop-plan-delete"]'::jsonb
where role = 'เซลล์'
  and not (page_permissions ? 'workshop-plan-edit' and page_permissions ? 'workshop-plan-delete');
