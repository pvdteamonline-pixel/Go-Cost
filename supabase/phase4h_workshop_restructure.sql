-- ============================================================
-- GoCost — Phase 4h: ปรับโครงสร้าง Workshop ครั้งใหญ่ตามที่ตกลงกันใหม่
-- รันหลัง phase4g_workshop_edit_delete.sql
--
-- การเปลี่ยนแปลงหลัก:
-- 1. แยกสิทธิ์ 'workshop-plan' เดิมเป็น 2 ตัว: 'workshop-plan-create' (สร้างคำขอ)
--    กับ 'workshop-plan-view' (ดูประวัติ)
-- 2. ตัดขั้นตอนบัญชีออกทั้งหมด — เซลล์กรอกข้อมูลหลังงานเสร็จ = จบเลย (status
--    เปลี่ยนเป็น completed ทันที ไม่ผ่าน pending_accounting อีกต่อไป)
-- 3. ช่องข้อมูลหลังงาน (จำนวนคนเข้างาน/ยอดขาย 2 ช่อง/ไฟล์แนบ) ไม่บังคับกรอกอีกต่อไป
-- 4. แก้ไข/ลบคำขอได้โดยไม่สนสถานะ (เอาเงื่อนไขสถานะที่เคยกันไว้ออกทั้งหมดตามที่ขอ
--    — เพิ่มความเสี่ยงเรื่องข้อมูลที่ "เสร็จสิ้น" แล้วถูกแก้ย้อนหลังได้ ให้ใช้ audit log
--    ในการตรวจสอบย้อนหลังแทน)
-- 5. เลขที่เอกสาร Workshop เปลี่ยนจาก 'WS'+timestamp เป็น 'IV'+ปี ค.ศ.+เลขรัน 6 หลัก
--    (รูปแบบเดียวกับ generate_document_number() ของฝั่งค่าใช้จ่าย แต่แยก sequence
--    คนละชุดกัน)
--
-- หมายเหตุ: complete_workshop_accounting, get_workshop_plans เดิมที่ join
-- accounting_doc_number ยังอยู่ในตารางเผื่อ backward-compat กับข้อมูลเก่าที่เคย
-- ผ่านขั้นตอนบัญชีไปแล้วก่อนเฟสนี้ แต่จะไม่ถูกเขียนเพิ่มอีกต่อไป
-- ============================================================

-- ─────────────────────────────────────────────
-- generate_workshop_doc_number — พอร์ตรูปแบบเดียวกับ generate_document_number()
-- แต่แยก sequence คนละชุด (prefix 'IV' คนละตัวกับ 'PV')
-- ─────────────────────────────────────────────
create or replace function generate_workshop_doc_number()
returns text
language plpgsql
as $$
declare
  current_year text := to_char(now(), 'YYYY');
  last_doc_no text;
  running_num int;
  new_doc_no text;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_workshop_doc_number_lock'));

  select id into last_doc_no
  from workshop_plans
  where id like 'IV' || current_year || '%'
  order by id desc
  limit 1;

  if last_doc_no is null then
    new_doc_no := 'IV' || current_year || '000001';
  else
    running_num := (substring(last_doc_no from 7))::int + 1;
    new_doc_no := 'IV' || current_year || lpad(running_num::text, 6, '0');
  end if;

  return new_doc_no;
end;
$$;

-- ─────────────────────────────────────────────
-- create_workshop_plan — ใช้เลขที่เอกสารรูปแบบใหม่ + เช็คสิทธิ์ใหม่ 'workshop-plan-create'
-- ─────────────────────────────────────────────
create or replace function create_workshop_plan(p_store_id bigint, p_planned_date date, p_created_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id text := generate_workshop_doc_number();
  v_store_name text;
begin
  if not has_page_permission(p_created_by, 'workshop-plan-create') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์สร้างคำขอ Workshop');
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

  insert into workshop_plans (id, store_id, planned_date, created_by)
  values (v_id, p_store_id, p_planned_date, p_created_by);

  perform add_notification('', '', format('%s เสนอแผน Workshop ร้าน %s วันที่ %s', p_created_by, v_store_name, p_planned_date), v_id);
  perform write_audit_log(p_created_by, 'CREATE_WORKSHOP', 'Workshop_Plans', format('สร้างแผน: %s (%s)', v_id, v_store_name));

  return jsonb_build_object('success', true, 'planId', v_id, 'message', 'ส่งคำขอ Workshop เรียบร้อย รอผู้มีสิทธิ์อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_plans — เช็คสิทธิ์ใหม่ (create/view/approve — ตัด accounting ออก)
-- ─────────────────────────────────────────────
create or replace function get_workshop_plans(p_actor_id text)
returns table (
  id text, store_id bigint, store_name text, region text, province text,
  assigned_sales_name text, planned_date date, status text,
  created_by text, created_at timestamptz, approved_by text, approved_at timestamptz, admin_note text,
  attendees int, sales_push_amount numeric, workshop_sales_amount numeric,
  attachment_path text, sales_data_submitted_at timestamptz,
  accounting_doc_number text, accounting_completed_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not (has_page_permission(p_actor_id, 'workshop-plan-create')
       or has_page_permission(p_actor_id, 'workshop-plan-view')
       or has_page_permission(p_actor_id, 'workshop-approve')) then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูล Workshop';
  end if;

  return query
  select wp.id, wp.store_id, s.name, s.region, s.province, u.name,
         wp.planned_date, wp.status, wp.created_by, wp.created_at,
         wp.approved_by, wp.approved_at, wp.admin_note,
         wp.attendees, wp.sales_push_amount, wp.workshop_sales_amount,
         wp.attachment_path, wp.sales_data_submitted_at,
         wp.accounting_doc_number, wp.accounting_completed_at
  from workshop_plans wp
  join stores s on s.id = wp.store_id
  left join users u on u.id = s.assigned_sales_id
  order by wp.created_at desc;
end;
$$;

-- ─────────────────────────────────────────────
-- approve_workshop_plan — สถานะปลายทางเปลี่ยนข้อความแจ้งเตือนให้ตรงกับ flow ใหม่
-- (logic การอนุมัติเหมือนเดิมทุกอย่าง แค่ข้อความแจ้งเตือนบอกว่า "รอเซลล์อัพเดตข้อมูล")
-- ─────────────────────────────────────────────
create or replace function approve_workshop_plan(p_plan_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  if not has_page_permission(p_actor_id, 'workshop-approve') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติ Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  update workshop_plans set status = 'awaiting_sales_data', approved_by = p_actor_id, approved_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('แผน Workshop %s ได้รับการอนุมัติแล้ว — รอคุณอัพเดตข้อมูลหลังงาน', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'APPROVE_WORKSHOP', 'Workshop_Plans', 'อนุมัติ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติแผน Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- submit_workshop_sales_data — เปลี่ยนใหญ่: ทุกช่องไม่บังคับกรอกแล้ว และกดยืนยันแล้ว
-- จบกระบวนการทันที (status → completed) ไม่ผ่านขั้นตอนบัญชีอีกต่อไป
-- ─────────────────────────────────────────────
create or replace function submit_workshop_sales_data(
  p_plan_id text, p_attendees int, p_sales_push_amount numeric,
  p_workshop_sales_amount numeric, p_attachment_path text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.created_by <> p_actor_id then
    return jsonb_build_object('success', false, 'message', 'คุณไม่ใช่เจ้าของแผนนี้');
  end if;
  if v_row.status <> 'awaiting_sales_data' then
    return jsonb_build_object('success', false, 'message', 'แผนนี้ไม่ได้อยู่ในสถานะรออัพเดตข้อมูล');
  end if;
  -- ไม่บังคับกรอกแล้วตามที่ขอ แค่กันค่าติดลบถ้ามีการกรอกมา
  if p_attendees is not null and p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนคนเข้างานต้องไม่ติดลบ');
  end if;
  if p_sales_push_amount is not null and p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขายดันเข้าร้านค้าต้องไม่ติดลบ');
  end if;
  if p_workshop_sales_amount is not null and p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขาย Workshop ต้องไม่ติดลบ');
  end if;

  update workshop_plans set
    attendees = p_attendees,
    sales_push_amount = p_sales_push_amount,
    workshop_sales_amount = p_workshop_sales_amount,
    attachment_path = p_attachment_path,
    sales_data_submitted_at = now(),
    status = 'completed'
  where id = p_plan_id;

  perform add_notification('', p_actor_id, format('Workshop %s เสร็จสิ้นสมบูรณ์แล้ว', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'COMPLETE_WORKSHOP', 'Workshop_Plans', 'อัพเดตข้อมูลและจบกระบวนการ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ Workshop นี้เสร็จสิ้นสมบูรณ์แล้ว');
end;
$$;

-- ─────────────────────────────────────────────
-- update_workshop_plan_request — ตัดเงื่อนไขสถานะออก (แก้ไขได้ไม่ว่าสถานะไหนตามที่ขอ)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- update_workshop_sales_data — ตัดเงื่อนไขสถานะออก + ทุกช่องไม่บังคับกรอกเหมือนกัน
-- ใช้แก้ไขข้อมูลหลังงานได้แม้สถานะจะ "เสร็จสิ้น" แล้วก็ตาม
-- ─────────────────────────────────────────────
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

  if p_attendees is not null and p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนคนเข้างานต้องไม่ติดลบ');
  end if;
  if p_sales_push_amount is not null and p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขายดันเข้าร้านค้าต้องไม่ติดลบ');
  end if;
  if p_workshop_sales_amount is not null and p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขาย Workshop ต้องไม่ติดลบ');
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

-- ─────────────────────────────────────────────
-- delete_workshop_plan — ตัดเงื่อนไขสถานะออก (ลบได้ไม่ว่าสถานะไหนตามที่ขอ)
-- ─────────────────────────────────────────────
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

  delete from workshop_plans where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'DELETE_WORKSHOP', 'Workshop_Plans', 'ลบคำขอ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'ลบคำขอ Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_sales_summary — เพิ่มจำนวนตามสถานะให้ครบ สำหรับหน้าแดชบอร์ด Workshop
-- ─────────────────────────────────────────────
create or replace function get_workshop_sales_summary(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_total_workshop_sales numeric := 0;
  v_total_push_sales numeric := 0;
  v_completed_count int := 0;
  v_pending_approval_count int := 0;
  v_awaiting_sales_count int := 0;
  v_rejected_count int := 0;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  select coalesce(sum(workshop_sales_amount), 0), coalesce(sum(sales_push_amount), 0), count(*)
  into v_total_workshop_sales, v_total_push_sales, v_completed_count
  from workshop_plans
  where status = 'completed'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  select count(*) into v_pending_approval_count from workshop_plans
  where status = 'pending_approval'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  select count(*) into v_awaiting_sales_count from workshop_plans
  where status = 'awaiting_sales_data'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  select count(*) into v_rejected_count from workshop_plans
  where status = 'rejected'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  return jsonb_build_object(
    'success', true,
    'totalWorkshopSales', v_total_workshop_sales,
    'totalPushSales', v_total_push_sales,
    'completedCount', v_completed_count,
    'pendingApprovalCount', v_pending_approval_count,
    'awaitingSalesCount', v_awaiting_sales_count,
    'rejectedCount', v_rejected_count
  );
end;
$$;

-- ─────────────────────────────────────────────
-- default permissions ใหม่: แยก workshop-plan-create/view แทน workshop-plan เดิม
-- ตัด workshop-accounting ออกจาก default ทุก role (ไม่มีหน้านี้แล้ว)
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
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history"]'::jsonb
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
-- backfill: แปลง permission เก่าเป็นชุดใหม่ให้ user ที่มีอยู่แล้ว
-- (ใครมี 'workshop-plan' เดิม → ได้ create+view ทั้งคู่, ตัด 'workshop-accounting'
-- ทิ้งไปเลยเพราะไม่มีหน้านี้แล้ว)
-- ─────────────────────────────────────────────
update users
set page_permissions = (page_permissions - 'workshop-plan' - 'workshop-accounting')
  || case when page_permissions ? 'workshop-plan'
          then '["workshop-plan-create","workshop-plan-view"]'::jsonb
          else '[]'::jsonb end
where page_permissions ? 'workshop-plan' or page_permissions ? 'workshop-accounting';

update users set page_permissions = page_permissions || '["workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'workshop-plan-view');
