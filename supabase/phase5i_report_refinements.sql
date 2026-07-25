-- ============================================================
-- GoCost — Phase 5i: ปรับปรุงตามที่ขอ
-- รันหลัง phase5h_reports.sql
--
-- 1. get_group_report — ดูยอดของกลุ่ม (แม่) พร้อมยอดแยกตามรหัสบัญชี (ลูก) แต่ละตัว
--    กรองตามเดือน/ปีได้ ใช้ในหน้า "กลุ่มรหัสบัญชี"
-- 2. get_executive_itemized_report — เปลี่ยนเป็นสรุปยอดตามกลุ่มเท่านั้น (ไม่โชว์
--    รายการย่อยระดับใบเสร็จอีกต่อไป) + เพิ่ม filter เดือน
-- 3. get_tax_filing_report — เพิ่มรายการย่อยระดับใบเสร็จในแต่ละรหัสบัญชี (ตรงข้าม
--    กับข้อ 2 — รายงานนี้ต้องแจกแจงละเอียดสำหรับส่งกรมสรรพากร)
-- ============================================================

-- ─────────────────────────────────────────────
-- get_group_report — เช่น "หมวดรายได้ 4000-00" แล้วแจกแจงยอดแต่ละรหัสลูกในกลุ่มนั้น
-- ตาม filter เดือน/ปีที่เลือก (ปีบังคับ, เดือนไม่บังคับ — ไม่เลือกเดือน = ทั้งปี)
-- ─────────────────────────────────────────────
create or replace function get_group_report(p_actor_id text, p_group_id bigint, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group record;
  v_members jsonb := '[]'::jsonb;
  v_group_total numeric := 0;
  a record;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานกลุ่มนี้');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  for a in select id, code, name from accounts where group_id = p_group_id order by code loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_group_total := v_group_total + v_account_total;
  end loop;

  return jsonb_build_object(
    'success', true,
    'groupCode', v_group.code, 'groupName', v_group.name,
    'year', p_year, 'month', p_month,
    'members', v_members, 'groupTotal', v_group_total
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_executive_itemized_report — เปลี่ยนเป็นสรุปยอดตามกลุ่ม/รหัสบัญชีเท่านั้น
-- (ตัด items[] ระดับใบเสร็จออก) + เพิ่ม p_month — ต้อง drop ก่อนเพราะเปลี่ยน signature
-- ─────────────────────────────────────────────
drop function if exists get_executive_itemized_report(text, int);
create or replace function get_executive_itemized_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_unassigned_total numeric;
  v_grand_total numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total numeric;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total := 0;
    for a in select id, code, name from accounts where group_id = g.id order by code loop
      select coalesce(sum(e.total), 0) into v_account_total
      from expense_records e
      where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month);

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'total', v_account_total
      ));
      v_group_total := v_group_total + v_account_total;
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'total', v_group_total, 'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  for a in select id, code, name from accounts where group_id is null order by code loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  select coalesce(sum(e.total), 0) into v_unassigned_total
  from expense_records e
  where e.account_id is null and e.main_category <> 'รายได้'
    and extract(year from e.event_date) = p_year
    and (p_month is null or extract(month from e.event_date) = p_month);

  v_grand_total := v_grand_total + v_unassigned_total;

  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassignedTotal', v_unassigned_total,
    'grandTotal', v_grand_total
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_tax_filing_report — เพิ่มรายการย่อยระดับใบเสร็จในแต่ละรหัส (แจกแจงละเอียด)
-- ต้อง drop ก่อนเพราะโครงสร้าง jsonb ผลลัพธ์เปลี่ยน (เพิ่ม lines[].items[])
-- ─────────────────────────────────────────────
drop function if exists get_tax_filing_report(text, int);
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
  acct record;
  v_items jsonb;
  v_acct_total numeric;
  v_lines jsonb;
  v_cat_total numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans where status = 'completed' and extract(year from planned_date) = p_year;

  for cat in
    select distinct a.category from accounts a
    join expense_records e on e.account_id = a.id
    where extract(year from e.event_date) = p_year
    order by a.category
  loop
    v_lines := '[]'::jsonb;
    v_cat_total := 0;

    for acct in
      select distinct a.id, a.code, a.name from accounts a
      join expense_records e on e.account_id = a.id
      where a.category = cat.category and extract(year from e.event_date) = p_year
      order by a.code
    loop
      select coalesce(jsonb_agg(jsonb_build_object(
               'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
               'detail', e.detail, 'qty', e.qty, 'unitPrice', e.unit_price, 'total', e.total
             ) order by e.event_date), '[]'::jsonb),
             coalesce(sum(e.total), 0)
      into v_items, v_acct_total
      from expense_records e
      where e.account_id = acct.id and extract(year from e.event_date) = p_year;

      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'code', acct.code, 'name', acct.name, 'total', v_acct_total, 'items', v_items
      ));
      v_cat_total := v_cat_total + v_acct_total;
    end loop;

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
