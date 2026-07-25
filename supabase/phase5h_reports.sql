-- ============================================================
-- GoCost — Phase 5h: รายงานผู้บริหาร (แยกกลุ่ม/รหัสบัญชี) + รายงานสำหรับกรมสรรพากร
-- รันหลัง phase5g_account_id_tagging.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- get_executive_itemized_report — ชี้แจงรายการย่อยทุกรายการ แยกตามกลุ่มแม่/ลูก
-- ใช้สิทธิ์ 'exec-report' แยกต่างหากจาก 'exec-dashboard' (แม้ผู้ชมจะเป็นกลุ่ม
-- เดียวกันโดย default แต่ ADMIN มอบสิทธิ์แยกกันได้อิสระถ้าต้องการ)
-- ─────────────────────────────────────────────
create or replace function get_executive_itemized_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_unassigned_items jsonb;
  v_unassigned_total numeric;
  v_grand_total numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total numeric;
  v_account_items jsonb;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- แต่ละกลุ่ม
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total := 0;
    for a in select id, code, name from accounts where group_id = g.id order by code loop
      select coalesce(jsonb_agg(jsonb_build_object(
               'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
               'detail', e.detail, 'qty', e.qty, 'unitPrice', e.unit_price, 'total', e.total
             ) order by e.event_date), '[]'::jsonb),
             coalesce(sum(e.total), 0)
      into v_account_items, v_account_total
      from expense_records e
      where e.account_id = a.id and extract(year from e.event_date) = p_year;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'accountId', a.id, 'code', a.code, 'name', a.name,
        'total', v_account_total, 'items', v_account_items
      ));
      v_group_total := v_group_total + v_account_total;
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'total', v_group_total, 'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  -- รหัสบัญชีที่ยังไม่มีกลุ่ม
  for a in select id, code, name from accounts where group_id is null order by code loop
    select coalesce(jsonb_agg(jsonb_build_object(
             'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
             'detail', e.detail, 'qty', e.qty, 'unitPrice', e.unit_price, 'total', e.total
           ) order by e.event_date), '[]'::jsonb),
           coalesce(sum(e.total), 0)
    into v_account_items, v_account_total
    from expense_records e
    where e.account_id = a.id and extract(year from e.event_date) = p_year;

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'accountId', a.id, 'code', a.code, 'name', a.name,
      'total', v_account_total, 'items', v_account_items
    ));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  -- รายจ่ายที่ยังไม่ได้ระบุรหัสบัญชี (ข้อมูลเก่าก่อนเฟสนี้)
  select coalesce(jsonb_agg(jsonb_build_object(
           'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
           'mainCategory', e.main_category, 'detail', e.detail, 'total', e.total
         ) order by e.event_date), '[]'::jsonb),
         coalesce(sum(e.total), 0)
  into v_unassigned_items, v_unassigned_total
  from expense_records e
  where e.account_id is null and e.main_category <> 'รายได้' and extract(year from e.event_date) = p_year;

  v_grand_total := v_grand_total + v_unassigned_total;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassigned', jsonb_build_object('total', v_unassigned_total, 'items', v_unassigned_items),
    'grandTotal', v_grand_total
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_tax_filing_report — สรุปรายได้/รายจ่ายสำหรับยื่นกรมสรรพากร แยกตามหมวดหมู่บัญชี
-- (รายได้ (Revenue) / ค่าใช้จ่าย (Expenses) / อื่นๆ (Others)) และรหัสบัญชีย่อยในแต่ละหมวด
-- permission key ใหม่ 'tax-report' แยกจาก exec-dashboard เพราะเป็นเอกสารสำหรับส่ง
-- หน่วยงานราชการ ควรจำกัดสิทธิ์แคบกว่า
-- ─────────────────────────────────────────────
create or replace function get_tax_filing_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_by_category jsonb := '[]'::jsonb;
  v_net numeric := 0;
  cat record;
  v_lines jsonb;
  v_cat_total numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- รายได้: จาก Workshop ที่เสร็จสิ้นในปีนั้น (แหล่งรายได้จริงของบริษัทตั้งแต่เฟส 4h)
  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans where status = 'completed' and extract(year from planned_date) = p_year;

  -- รายจ่าย: แยกตามหมวดหมู่บัญชี (accounts.category) แล้วแตกเป็นรายรหัสในหมวดนั้น
  for cat in
    select distinct a.category from accounts a
    join expense_records e on e.account_id = a.id
    where extract(year from e.event_date) = p_year
    order by a.category
  loop
    select coalesce(jsonb_agg(jsonb_build_object(
             'code', a.code, 'name', a.name, 'total', line.total
           ) order by a.code), '[]'::jsonb),
           coalesce(sum(line.total), 0)
    into v_lines, v_cat_total
    from (
      select account_id, sum(total) as total
      from expense_records
      where extract(year from event_date) = p_year and account_id is not null
      group by account_id
    ) line
    join accounts a on a.id = line.account_id
    where a.category = cat.category;

    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
  end loop;

  select coalesce(sum(e.total), 0) into v_net
  from expense_records e
  where e.account_id is not null and extract(year from e.event_date) = p_year;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'totalRevenue', v_total_revenue,
    'totalExpenses', v_net,
    'netIncome', v_total_revenue - v_net,
    'byCategory', v_by_category
  );
end;
$$;

-- ─────────────────────────────────────────────
-- default permission ใหม่: 'tax-report' — ADMIN เท่านั้น (เอกสารส่งราชการ จำกัดแคบ)
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
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores","accounts","account-groups","budgets","exec-dashboard","exec-report","tax-report"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve","exec-dashboard","exec-report"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","accounts","account-groups"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

update users set page_permissions = page_permissions || '["tax-report"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'tax-report');

update users set page_permissions = page_permissions || '["exec-report"]'::jsonb
where (role = 'ADMIN' or role = 'ผู้บริหาร') and not (page_permissions ? 'exec-report');
