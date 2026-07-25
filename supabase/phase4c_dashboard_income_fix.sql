-- ============================================================
-- GoCost — Phase 4c: แก้ get_dashboard_stats ให้แยกหมวด "รายได้" ออกจากยอดใช้จ่ายจริง
--
-- เหตุผล: ตอนตรวจสอบ get_dashboard_stats ครั้งก่อน (เฟส 2) พบว่าโค้ดต้นฉบับ (Apps
-- Script เดิม) มี logic แยกหมวด "รายได้"/"ยอดขายดันสินค้าเข้า" ออกจากยอดใช้จ่าย แต่
-- ไม่เคยทำงานจริงเพราะหมวดหมู่นี้ไม่มีอยู่ใน dropdown เลย จึงตอนนั้นตัดสินใจไม่พอร์ต
-- ส่วนนี้มา (เพราะดูเหมือน dead code) — ตอนนี้ Workshop flow ใหม่ทำให้หมวดนี้ถูกใช้งาน
-- จริงแล้ว (complete_workshop_accounting เขียนแถว main_category='รายได้' จริง) จึงต้อง
-- เพิ่ม logic แยกยอดนี้ออกจาก totalExpenses/byCategory ให้ถูกต้อง ไม่งั้นยอดรายได้จาก
-- Workshop จะไปปนเข้ากับยอดใช้จ่ายรวมอย่างผิดพลาด
-- ============================================================

create or replace function get_dashboard_stats(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_category text := nullif(trim(p_filters->>'category'), '');
  v_detail text := nullif(trim(p_filters->>'detail'), '');
  v_store text := nullif(trim(p_filters->>'store'), '');
  v_total_expenses numeric := 0;
  v_total_income numeric := 0;
  v_by_category jsonb := '{}'::jsonb;
  v_by_month jsonb := '{}'::jsonb;
  v_doc_count int := 0;
  v_top_category text := '-';
  v_top_amount numeric := 0;
  r record;
  v_cat_amount numeric;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  -- ยอดใช้จ่ายจริง (ไม่รวมแถว main_category = 'รายได้')
  for r in
    select doc_number, main_category, event_date,
           sum(total) as row_total
    from expense_records
    where main_category <> 'รายได้'
      and (v_year is null or extract(year from event_date) = v_year)
      and (v_month is null or extract(month from event_date) = v_month)
      and (v_category is null or main_category = v_category)
      and (v_detail is null or detail = v_detail)
      and (v_store is null or store_name = v_store)
    group by doc_number, main_category, event_date
  loop
    v_total_expenses := v_total_expenses + coalesce(r.row_total, 0);
    v_cat_amount := coalesce((v_by_category->>r.main_category)::numeric, 0) + coalesce(r.row_total, 0);
    v_by_category := v_by_category || jsonb_build_object(r.main_category, v_cat_amount);
    if r.event_date is not null then
      v_by_month := v_by_month || jsonb_build_object(
        to_char(r.event_date, 'YYYY-MM'),
        coalesce((v_by_month->>to_char(r.event_date, 'YYYY-MM'))::numeric, 0) + coalesce(r.row_total, 0)
      );
    end if;
  end loop;

  -- ยอดรายได้ (เฉพาะแถว main_category = 'รายได้' — มาจาก Workshop accounting เท่านั้น)
  select coalesce(sum(total), 0) into v_total_income
  from expense_records
  where main_category = 'รายได้'
    and (v_year is null or extract(year from event_date) = v_year)
    and (v_month is null or extract(month from event_date) = v_month)
    and (v_store is null or store_name = v_store);

  select count(distinct doc_number) into v_doc_count
  from expense_records
  where main_category <> 'รายได้'
    and (v_year is null or extract(year from event_date) = v_year)
    and (v_month is null or extract(month from event_date) = v_month)
    and (v_category is null or main_category = v_category)
    and (v_detail is null or detail = v_detail)
    and (v_store is null or store_name = v_store);

  select key, value::numeric into v_top_category, v_top_amount
  from jsonb_each_text(v_by_category)
  order by value::numeric desc
  limit 1;

  return jsonb_build_object(
    'success', true,
    'totalExpenses', v_total_expenses,
    'totalSpend', v_total_expenses,
    'totalIncome', v_total_income,
    'netDiff', v_total_income - v_total_expenses,
    'docCount', v_doc_count,
    'avgPerDoc', case when v_doc_count > 0 then v_total_expenses / v_doc_count else 0 end,
    'topCategory', coalesce(v_top_category, '-'),
    'topCategoryAmount', coalesce(v_top_amount, 0),
    'byCategory', v_by_category,
    'byMonth', v_by_month
  );
end;
$$;
