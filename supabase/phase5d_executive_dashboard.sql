-- ============================================================
-- GoCost — Phase 5d: แดชบอร์ดฝ่ายบริหาร (P&L ครบวงจร + งบเทียบจริงต่อหมวดหมู่)
-- รันหลัง phase5c_import_log.sql
--
-- ที่มาของตัวเลข "รายได้" — สำคัญมาก อ่านก่อนใช้งาน:
-- ตั้งแต่เฟส 4h ตัดขั้นตอนบัญชีของ Workshop ออกไปแล้ว ทำให้ Workshop ไม่เขียนแถว
-- ลง expense_records อีกต่อไป (ของเดิมเคยเติมแถว main_category='รายได้' ให้อัตโนมัติ
-- ตอนบัญชียืนยัน — ตอนนี้ไม่มีแล้ว) ดังนั้น "รายได้จริง" ของบริษัทตอนนี้ต้องดึงจาก
-- workshop_plans.sales_push_amount (ยอดขายดันเข้าร้านค้า) โดยตรง ไม่ใช่จาก
-- expense_records อีกต่อไป — แดชบอร์ดนี้จึงดึงรายได้จาก Workshop เป็นหลัก
-- ============================================================

create or replace function get_executive_dashboard(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_total_expenses numeric := 0;
  v_by_category jsonb := '[]'::jsonb;
  r record;
begin
  if not has_page_permission(p_actor_id, 'exec-dashboard') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูแดชบอร์ดฝ่ายบริหาร');
  end if;

  -- รายได้จริง: จาก Workshop ที่เสร็จสิ้นแล้วในปีนั้น (ยอดขายดันเข้าร้านค้า)
  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans
  where status = 'completed' and extract(year from planned_date) = p_year;

  -- รายจ่ายจริง: จาก expense_records ทั้งหมด (ไม่รวมแถว 'รายได้' เก่าที่อาจหลงเหลือ
  -- จากก่อนเฟส 4h)
  select coalesce(sum(total), 0) into v_total_expenses
  from expense_records
  where main_category <> 'รายได้' and extract(year from event_date) = p_year;

  -- สรุปรายหมวดหมู่ เทียบกับงบที่ตั้งไว้
  for r in
    select
      e.main_category as category,
      coalesce(sum(e.total), 0) as actual,
      coalesce(b.amount, 0) as budget
    from expense_records e
    left join budgets b on b.category = e.main_category and b.year = p_year
    where e.main_category <> 'รายได้' and extract(year from e.event_date) = p_year
    group by e.main_category, b.amount

    union all

    -- รวมหมวดที่ตั้งงบไว้แต่ยังไม่มีรายจ่ายจริงในปีนี้ (actual = 0) ด้วย
    select b.category, 0, b.amount
    from budgets b
    where b.year = p_year
      and not exists (
        select 1 from expense_records e2
        where e2.main_category = b.category and extract(year from e2.event_date) = p_year
      )
  loop
    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', r.category,
      'actual', r.actual,
      'budget', r.budget,
      'remaining', r.budget - r.actual,
      'pctUsed', case when r.budget > 0 then round((r.actual / r.budget) * 100, 1) else null end
    ));
  end loop;

  return jsonb_build_object(
    'success', true,
    'year', p_year,
    'totalRevenue', v_total_revenue,
    'totalExpenses', v_total_expenses,
    'netProfit', v_total_revenue - v_total_expenses,
    'byCategory', v_by_category
  );
end;
$$;
