-- ============================================================
-- GoCost — Phase 5p: เปลี่ยน Data Source หลักเป็น account_import_lines (pl_estimate)
-- รันหลัง phase5o_pl_file_import.sql
--
-- หลังจากเปลี่ยน workflow ให้หัวหน้าบัญชีโยนไฟล์เดียวจบ (ผ่าน process นอก ก่อนเข้าแอพ)
-- ข้อมูลหลักของบริษัทจึงอยู่ใน account_import_lines (batch_type = 'pl_estimate')
-- ไม่ใช่ expense_records ที่ให้พนักงานกรอกเองอีกต่อไป
--
-- ฟังก์ชันที่อัปเดต:
-- 1. get_executive_itemized_report — รายงานผู้บริหาร (แยกกลุ่ม → รหัสบัญชี)
-- 2. get_tax_filing_report         — รายงานสรรพากร (P&L ละเอียด)
-- 3. get_group_report              — ยอดรหัสบัญชีในกลุ่ม (ใช้ในหน้ากลุ่มรหัสบัญชี)
-- 4. get_dashboard_stats           — แดชบอร์ดหลัก (ยอดรวม / กราฟ)
-- 5. get_filter_options            — dropdown ตัวกรอง (ปี / หมวดหมู่)
--
-- หมายเหตุ: get_reconciliation_report ไม่ต้องแก้
-- เพราะออกแบบมาให้ "เทียบ" ระหว่าง 2 แหล่ง (expense_records vs account_import_lines)
-- ============================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. get_executive_itemized_report
--    เดิม: ดึงจาก expense_records (พนักงานกรอกมือ)
--    ใหม่: ดึงจาก account_import_lines (ไฟล์ที่หัวหน้าบัญชีแนบ, batch_type='pl_estimate')
-- ─────────────────────────────────────────────────────────────────
drop function if exists get_executive_itemized_report(text, int, int);
create or replace function get_executive_itemized_report(
  p_actor_id text,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups           jsonb   := '[]'::jsonb;
  v_ungrouped        jsonb   := '[]'::jsonb;
  v_unassigned_total numeric := 0;
  v_grand_total      numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total    numeric;
  v_account_total  numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- วนทุกกลุ่มบัญชี
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total    := 0;

    for a in select id, code, name from accounts where group_id = g.id order by code loop
      select coalesce(sum(l.amount), 0) into v_account_total
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id
        and b.batch_type = 'pl_estimate'
        and b.year       = p_year
        and (p_month is null or l.month = p_month);

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

  -- รหัสบัญชีที่ยังไม่มีกลุ่ม
  for a in select id, code, name from accounts where group_id is null order by code loop
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = p_year
      and (p_month is null or l.month = p_month);

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  -- ไฟล์ pl_estimate บังคับให้ทุกรหัสมีอยู่ในระบบก่อนนำเข้า จึงไม่มี "unassigned"
  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups',            v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassignedTotal',   v_unassigned_total,
    'grandTotal',        v_grand_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 2. get_tax_filing_report
--    เดิม: รายจ่ายจาก expense_records
--    ใหม่: รายจ่ายจาก account_import_lines (pl_estimate)
--    รายได้ยังดึงจาก workshop_plans.sales_push_amount เหมือนเดิม
-- ─────────────────────────────────────────────────────────────────
drop function if exists get_tax_filing_report(text, int);
create or replace function get_tax_filing_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_by_category   jsonb   := '[]'::jsonb;
  v_net           numeric := 0;
  cat  record;
  acct record;
  v_acct_total numeric;
  v_lines      jsonb;
  v_cat_total  numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- รายได้: ยังคงมาจาก Workshop (sales_push_amount) เหมือนเดิม
  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans
  where status = 'completed'
    and extract(year from planned_date) = p_year;

  -- รายจ่าย: แยกตามหมวดหมู่บัญชี (accounts.category) จากไฟล์ pl_estimate
  for cat in
    select distinct a.category
    from accounts a
    join account_import_lines l   on l.account_id = a.id
    join account_import_batches b on b.id = l.batch_id
    where b.batch_type = 'pl_estimate'
      and b.year = p_year
    order by a.category
  loop
    v_lines     := '[]'::jsonb;
    v_cat_total := 0;

    for acct in
      select distinct a.id, a.code, a.name
      from accounts a
      join account_import_lines l   on l.account_id = a.id
      join account_import_batches b on b.id = l.batch_id
      where a.category = cat.category
        and b.batch_type = 'pl_estimate'
        and b.year = p_year
      order by a.code
    loop
      select coalesce(sum(l.amount), 0) into v_acct_total
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = acct.id
        and b.batch_type = 'pl_estimate'
        and b.year = p_year;

      -- items = [] เพราะไฟล์ pl_estimate เก็บยอดรวม ไม่มีรายการใบเสร็จย่อย
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'code',  acct.code, 'name', acct.name,
        'total', v_acct_total,
        'items', '[]'::jsonb
      ));
      v_cat_total := v_cat_total + v_acct_total;
    end loop;

    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
  end loop;

  -- ยอดรายจ่ายรวมทั้งปีจากไฟล์
  select coalesce(sum(l.amount), 0) into v_net
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  where b.batch_type = 'pl_estimate'
    and b.year = p_year;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'totalRevenue',  v_total_revenue,
    'totalExpenses', v_net,
    'netIncome',     v_total_revenue - v_net,
    'byCategory',    v_by_category
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 3. get_group_report
--    เดิม: ดึงจาก expense_records
--    ใหม่: ดึงจาก account_import_lines (pl_estimate)
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_report(
  p_actor_id text, p_group_id bigint, p_year int, p_month int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group       record;
  v_members     jsonb   := '[]'::jsonb;
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
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = p_year
      and (p_month is null or l.month = p_month);

    v_members     := v_members || jsonb_build_array(jsonb_build_object(
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


-- ─────────────────────────────────────────────────────────────────
-- 4. get_dashboard_stats
--    เดิม: ดึงจาก expense_records (กรอกมือ)
--    ใหม่: ดึงจาก account_import_lines (pl_estimate)
--
--    หมายเหตุ filter:
--    - year/month   ยังกรองได้ตามปกติ
--    - category     กรองตาม accounts.category
--    - store/detail ไม่มีในไฟล์ pl_estimate — รับ parameter ไว้แต่ไม่กรอง (backward-compat)
-- ─────────────────────────────────────────────────────────────────
create or replace function get_dashboard_stats(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year     int  := (p_filters->>'year')::int;
  v_month    int  := (p_filters->>'month')::int;
  v_category text := nullif(trim(p_filters->>'category'), '');
  -- v_detail / v_store: ยังรับมาเพื่อ backward-compat แต่ไม่ใช้
  -- เพราะ account_import_lines ไม่มีข้อมูลระดับใบเสร็จ/ร้านค้า

  v_total_expenses numeric := 0;
  v_total_income   numeric := 0;
  v_by_category    jsonb   := '{}'::jsonb;
  v_by_month       jsonb   := '{}'::jsonb;
  v_doc_count      int     := 0;
  v_top_category   text    := '-';
  v_top_amount     numeric := 0;
  r            record;
  v_cat_amount numeric;
  v_month_key  text;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  -- ยอดรายจ่ายจากไฟล์ pl_estimate
  for r in
    select
      a.category        as main_category,
      l.month           as line_month,
      b.year            as line_year,
      sum(l.amount)     as row_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a               on a.id = l.account_id
    where b.batch_type = 'pl_estimate'
      and (v_year     is null or b.year  = v_year)
      and (v_month    is null or l.month = v_month)
      and (v_category is null or a.category = v_category)
    group by a.category, l.month, b.year
  loop
    v_total_expenses := v_total_expenses + coalesce(r.row_total, 0);

    -- byCategory (key = ชื่อหมวดหมู่บัญชี)
    v_cat_amount  := coalesce((v_by_category->>r.main_category)::numeric, 0) + coalesce(r.row_total, 0);
    v_by_category := v_by_category || jsonb_build_object(r.main_category, v_cat_amount);

    -- byMonth (key = "YYYY-MM")
    if r.line_month is not null then
      v_month_key := r.line_year::text || '-' || lpad(r.line_month::text, 2, '0');
      v_by_month  := v_by_month || jsonb_build_object(
        v_month_key,
        coalesce((v_by_month->>v_month_key)::numeric, 0) + coalesce(r.row_total, 0)
      );
    end if;
  end loop;

  -- รายได้ยังคงมาจาก Workshop (sales_push_amount)
  select coalesce(sum(sales_push_amount), 0) into v_total_income
  from workshop_plans
  where status = 'completed'
    and (v_year  is null or extract(year  from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  -- docCount = จำนวน batch ที่ import ในปีนั้น (แทน doc_number เดิม)
  select count(distinct b.id) into v_doc_count
  from account_import_batches b
  where b.batch_type = 'pl_estimate'
    and (v_year is null or b.year = v_year);

  -- หมวดหมู่ที่มียอดสูงสุด
  select key, value::numeric into v_top_category, v_top_amount
  from jsonb_each_text(v_by_category)
  order by value::numeric desc
  limit 1;

  return jsonb_build_object(
    'success',           true,
    'totalExpenses',     v_total_expenses,
    'totalSpend',        v_total_expenses,
    'totalIncome',       v_total_income,
    'netDiff',           v_total_income - v_total_expenses,
    'docCount',          v_doc_count,
    'avgPerDoc',         case when v_doc_count > 0 then v_total_expenses / v_doc_count else 0 end,
    'topCategory',       coalesce(v_top_category, '-'),
    'topCategoryAmount', coalesce(v_top_amount, 0),
    'byCategory',        v_by_category,
    'byMonth',           v_by_month
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 5. get_filter_options
--    เดิม: ปี/หมวดหมู่/รายละเอียด/ร้านค้า จาก expense_records
--    ใหม่: ปี/หมวดหมู่ จาก account_import_batches + accounts (pl_estimate เท่านั้น)
--    store/detail คืน [] เพราะไฟล์ pl_estimate ไม่มีข้อมูลระดับนั้น
-- ─────────────────────────────────────────────────────────────────
create or replace function get_filter_options()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_years      jsonb := '[]'::jsonb;
  v_categories jsonb := '[]'::jsonb;
begin
  -- ปีที่มีข้อมูล (จาก batch ที่ import)
  select coalesce(jsonb_agg(distinct b.year order by b.year desc), '[]'::jsonb)
  into v_years
  from account_import_batches b
  where b.batch_type = 'pl_estimate';

  -- หมวดหมู่บัญชี (จากรหัสที่มีข้อมูลใน import_lines)
  select coalesce(jsonb_agg(distinct a.category order by a.category), '[]'::jsonb)
  into v_categories
  from accounts a
  join account_import_lines l   on l.account_id = a.id
  join account_import_batches b on b.id = l.batch_id
  where b.batch_type = 'pl_estimate'
    and a.category is not null;

  return jsonb_build_object(
    'success',    true,
    'years',      v_years,
    'categories', v_categories,
    'details',    '[]'::jsonb,
    'storeNames', '[]'::jsonb
  );
end;
$$;
