-- ============================================================
-- GoCost — Phase 5s: รายงานผู้บริหารแบบตารางรายเดือน (ตาม template "งบบริหาร" จริง)
-- รันหลัง phase5r_trial_balance.sql
--
-- ออกแบบตามไฟล์ตัวอย่าง "งบบริหาร" ที่ส่งมา: ตาราง รหัสบัญชี|ชื่อบัญชี|ม.ค....ธ.ค.|รวม
-- แบ่งเป็นกลุ่ม (จากตาราง account_groups ที่คุณสร้างเอง) แต่ละกลุ่มมี % ของรายได้
-- กำกับ, รหัสบัญชีที่ยังไม่มีกลุ่มจะไม่ปรากฏใน % (เพราะยังไม่ได้จัดหมวดเอง)
--
-- แหล่งข้อมูล: account_import_lines (batch_type='pl_estimate') — ใช้ตัวเดียวกับ
-- ที่ phase5p วางไว้เป็นแหล่งหลักของ get_executive_itemized_report/get_group_report
-- อยู่แล้ว เพื่อไม่ให้มีตัวเลข 2 ชุดขัดแย้งกันในหน้าต่างๆ ของฝ่ายบริหาร
--
-- รายได้รวม (ใช้คำนวณ %): ผลรวมยอดของรหัสบัญชีที่ accounts.category = 'รายได้ (Revenue)'
-- (ไม่ได้อิงจากกลุ่มที่ตั้งเอง เพราะกลุ่มถูกลบไปแล้วตามที่ขอ และคุณอาจยังไม่ได้สร้าง
-- กลุ่ม "รายได้" ขึ้นมาใหม่ — ใช้ category ที่มีอยู่แล้วในผังบัญชีแทน แม่นยำกว่า)
-- ============================================================

create or replace function get_executive_monthly_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_revenue_monthly numeric[] := array_fill(0::numeric, array[12]);
  v_revenue_total numeric := 0;
  g record;
  a record;
  m int;
  v_group_accounts jsonb;
  v_group_monthly numeric[];
  v_group_total numeric;
  v_acct_monthly numeric[];
  v_acct_total numeric;
  v_amt numeric;
  v_pct_monthly jsonb;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- รายได้รวมทั้งปี แยกรายเดือน (ใช้คำนวณ % ของแต่ละกลุ่ม)
  for m in 1..12 loop
    select coalesce(sum(l.amount), 0) into v_amt
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a2 on a2.id = l.account_id
    where b.batch_type = 'pl_estimate' and b.year = p_year and l.month = m
      and a2.category = 'รายได้ (Revenue)';
    v_revenue_monthly[m] := v_amt;
    v_revenue_total := v_revenue_total + v_amt;
  end loop;

  -- แต่ละกลุ่ม
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_monthly := array_fill(0::numeric, array[12]);
    v_group_total := 0;

    for a in select id, code, name from accounts where group_id = g.id order by code loop
      v_acct_monthly := array_fill(0::numeric, array[12]);
      v_acct_total := 0;
      for m in 1..12 loop
        select coalesce(sum(l.amount), 0) into v_amt
        from account_import_lines l
        join account_import_batches b on b.id = l.batch_id
        where l.account_id = a.id and b.batch_type = 'pl_estimate' and b.year = p_year and l.month = m;
        v_acct_monthly[m] := v_amt;
        v_acct_total := v_acct_total + v_amt;
        v_group_monthly[m] := v_group_monthly[m] + v_amt;
      end loop;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name,
        'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
      ));
      v_group_total := v_group_total + v_acct_total;
    end loop;

    v_pct_monthly := '[]'::jsonb;
    for m in 1..12 loop
      v_pct_monthly := v_pct_monthly || jsonb_build_array(
        case when v_revenue_monthly[m] > 0 then round((v_group_monthly[m] / v_revenue_monthly[m]) * 100, 2) else null end
      );
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'accounts', v_group_accounts,
      'monthly', to_jsonb(v_group_monthly), 'total', v_group_total,
      'pctOfRevenueMonthly', v_pct_monthly,
      'pctOfRevenueTotal', case when v_revenue_total > 0 then round((v_group_total / v_revenue_total) * 100, 2) else null end
    ));
  end loop;

  -- รหัสที่ยังไม่มีกลุ่ม
  for a in select id, code, name from accounts where group_id is null order by code loop
    v_acct_monthly := array_fill(0::numeric, array[12]);
    v_acct_total := 0;
    for m in 1..12 loop
      select coalesce(sum(l.amount), 0) into v_amt
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.batch_type = 'pl_estimate' and b.year = p_year and l.month = m;
      v_acct_monthly[m] := v_amt;
      v_acct_total := v_acct_total + v_amt;
    end loop;
    if v_acct_total <> 0 then
      v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'revenueMonthly', to_jsonb(v_revenue_monthly), 'revenueTotal', v_revenue_total,
    'groups', v_groups, 'ungroupedAccounts', v_ungrouped
  );
end;
$$;
