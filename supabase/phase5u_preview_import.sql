-- ============================================================
-- GoCost — Phase 5u: Preview PL Import Reports (Dry-run)
-- สร้าง function ที่ simulate ผลลัพธ์ของการ import ไฟล์ P&L
-- โดยไม่บันทึกข้อมูลจริงลง DB — ใช้สำหรับ Preview ก่อนยืนยัน
--
-- Input: p_rows = [{code, month, amount, description}]
--        p_year = ปีที่ import
-- Output: {
--   execReport: { ...same format as get_executive_monthly_report },
--   taxReport:  { ...same format as get_tax_filing_report }
-- }
-- ============================================================

create or replace function preview_pl_import_reports(
  p_actor_id text,
  p_rows     jsonb,   -- [{code, month, amount, description}]
  p_year     int
)
returns jsonb
language plpgsql
security definer
as $$
declare
  -- Exec report
  v_groups          jsonb := '[]'::jsonb;
  v_ungrouped       jsonb := '[]'::jsonb;
  v_rev_monthly     numeric[] := array_fill(0::numeric, array[12]);
  v_rev_total       numeric := 0;
  g                 record;
  a                 record;
  m                 int;
  v_group_accounts  jsonb;
  v_group_monthly   numeric[];
  v_group_total     numeric;
  v_acct_monthly    numeric[];
  v_acct_total      numeric;
  v_amt             numeric;
  v_pct_monthly     jsonb;

  -- Tax report
  v_tax_by_cat      jsonb := '[]'::jsonb;
  v_tax_rev         numeric := 0;
  v_tax_exp_total   numeric := 0;
  cat               record;
  v_lines           jsonb;
  v_cat_total       numeric;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'ไม่มีสิทธิ์ preview');
  end if;

  -- สร้าง temp table จาก p_rows เพื่อ query ได้ง่าย
  create temp table _preview_lines (
    account_id  uuid,
    code        text,
    category    text,
    group_id    uuid,
    month       int,
    amount      numeric
  ) on commit drop;

  insert into _preview_lines (account_id, code, category, group_id, month, amount)
  select
    ac.id,
    ac.code,
    ac.category,
    ac.group_id,
    (row_obj->>'month')::int,
    (row_obj->>'amount')::numeric
  from jsonb_array_elements(p_rows) as row_obj
  join accounts ac on ac.code = row_obj->>'code'
  where (row_obj->>'month')::int between 1 and 12;

  -- ═══════════════════════════════
  -- EXEC REPORT (รายงานผู้บริหาร)
  -- ═══════════════════════════════

  -- รายได้รวม (category = 'รายได้ (Revenue)')
  for m in 1..12 loop
    select coalesce(sum(pl.amount), 0) into v_amt
    from _preview_lines pl
    where pl.category = 'รายได้ (Revenue)' and pl.month = m;
    v_rev_monthly[m] := v_amt;
    v_rev_total := v_rev_total + v_amt;
  end loop;

  -- แต่ละกลุ่ม
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_monthly  := array_fill(0::numeric, array[12]);
    v_group_total    := 0;

    for a in select id, code, name from accounts where group_id = g.id order by code loop
      v_acct_monthly := array_fill(0::numeric, array[12]);
      v_acct_total   := 0;
      for m in 1..12 loop
        select coalesce(sum(pl.amount), 0) into v_amt
        from _preview_lines pl
        where pl.account_id = a.id and pl.month = m;
        v_acct_monthly[m] := v_amt;
        v_acct_total      := v_acct_total + v_amt;
        v_group_monthly[m]:= v_group_monthly[m] + v_amt;
      end loop;

      -- แสดงเฉพาะรหัสที่มีข้อมูลใน preview
      if v_acct_total <> 0 then
        v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
          'code', a.code, 'name', a.name,
          'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
        ));
      end if;
      v_group_total := v_group_total + v_acct_total;
    end loop;

    v_pct_monthly := '[]'::jsonb;
    for m in 1..12 loop
      v_pct_monthly := v_pct_monthly || jsonb_build_array(
        case when v_rev_monthly[m] > 0
             then round((v_group_monthly[m] / v_rev_monthly[m]) * 100, 2)
             else null end
      );
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'accounts', v_group_accounts,
      'monthly', to_jsonb(v_group_monthly), 'total', v_group_total,
      'pctOfRevenueMonthly', v_pct_monthly,
      'pctOfRevenueTotal',
        case when v_rev_total > 0
             then round((v_group_total / v_rev_total) * 100, 2)
             else null end
    ));
  end loop;

  -- รหัสที่ไม่มีกลุ่ม
  for a in
    select pl.account_id as id, pl.code, acc.name
    from _preview_lines pl
    join accounts acc on acc.id = pl.account_id
    where pl.group_id is null
    group by pl.account_id, pl.code, acc.name
    order by pl.code
  loop
    v_acct_monthly := array_fill(0::numeric, array[12]);
    v_acct_total   := 0;
    for m in 1..12 loop
      select coalesce(sum(pl.amount), 0) into v_amt
      from _preview_lines pl
      where pl.account_id = a.id and pl.month = m;
      v_acct_monthly[m] := v_amt;
      v_acct_total      := v_acct_total + v_amt;
    end loop;
    if v_acct_total <> 0 then
      v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name,
        'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
      ));
    end if;
  end loop;

  -- ═══════════════════════════════
  -- TAX REPORT (รายงานสรรพากร)
  -- ═══════════════════════════════

  -- รายได้: ใช้จาก preview rows ที่ category = 'รายได้ (Revenue)'
  select coalesce(sum(pl.amount), 0) into v_tax_rev
  from _preview_lines pl
  where pl.category = 'รายได้ (Revenue)';

  -- รายจ่าย: แยกตาม category (ไม่ใช่รายได้)
  for cat in
    select distinct pl.category
    from _preview_lines pl
    where pl.category <> 'รายได้ (Revenue)' and pl.category is not null
    order by pl.category
  loop
    select
      coalesce(
        jsonb_agg(jsonb_build_object(
          'code', q.code, 'name', q.name,
          'total', q.total,
          'items', '[]'::jsonb   -- preview ไม่มีรายการ expense_records
        ) order by q.code),
        '[]'::jsonb
      ),
      coalesce(sum(q.total), 0)
    into v_lines, v_cat_total
    from (
      select pl.code, acc.name, sum(pl.amount) as total
      from _preview_lines pl
      join accounts acc on acc.id = pl.account_id
      where pl.category = cat.category
      group by pl.code, acc.name
    ) q;

    v_tax_by_cat := v_tax_by_cat || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
    v_tax_exp_total := v_tax_exp_total + v_cat_total;
  end loop;

  return jsonb_build_object(
    'success', true,
    'execReport', jsonb_build_object(
      'success', true, 'year', p_year,
      'revenueMonthly', to_jsonb(v_rev_monthly),
      'revenueTotal', v_rev_total,
      'groups', v_groups,
      'ungroupedAccounts', v_ungrouped
    ),
    'taxReport', jsonb_build_object(
      'success', true, 'year', p_year,
      'totalRevenue', v_tax_rev,
      'totalExpenses', v_tax_exp_total,
      'netIncome', v_tax_rev - v_tax_exp_total,
      'byCategory', v_tax_by_cat
    )
  );
end;
$$;
