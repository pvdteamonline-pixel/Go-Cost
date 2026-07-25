-- ============================================================
-- GoCost — Phase 5k: เทียบยอด (Reconciliation) — โชว์ผลต่างระหว่าง 2 แหล่งข้อมูล
-- รันหลัง phase5j_account_file_import.sql
--
-- เปรียบเทียบ "ยอดที่พนักงานกรอกเอง" (expense_records.account_id) กับ
-- "ยอดจากไฟล์ที่แนบ" (account_import_lines จากไฟล์รายจ่ายจริง) ต่อรหัสบัญชี
-- ตามช่วงเวลาที่เลือก แสดงผลต่างให้เห็นชัดเจน ไม่ได้รวม/แทนที่กัน ยังเป็นข้อมูล
-- 2 แหล่งแยกกันเหมือนเดิม แค่เอามาเทียบข้างกันให้ดูง่ายขึ้น
-- ============================================================

create or replace function get_reconciliation_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_rows jsonb := '[]'::jsonb;
  a record;
  v_staff_amount numeric;
  v_file_amount numeric;
begin
  if not has_page_permission(p_actor_id, 'reconciliation') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานเทียบยอด');
  end if;

  for a in
    select distinct a.id, a.code, a.name
    from accounts a
    where exists (
      select 1 from expense_records e where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month)
    ) or exists (
      select 1 from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.batch_type = 'expense_file' and b.year = p_year
        and (p_month is null or b.month = p_month or b.month is null)
    )
    order by a.code
  loop
    select coalesce(sum(e.total), 0) into v_staff_amount
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    select coalesce(sum(l.amount), 0) into v_file_amount
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id and b.batch_type = 'expense_file' and b.year = p_year
      and (p_month is null or b.month = p_month or b.month is null);

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name,
      'staffAmount', v_staff_amount, 'fileAmount', v_file_amount,
      'diff', v_file_amount - v_staff_amount
    ));
  end loop;

  return jsonb_build_object('success', true, 'year', p_year, 'month', p_month, 'rows', v_rows);
end;
$$;

-- default permission: 'reconciliation' — ADMIN เท่านั้น default
update users set page_permissions = page_permissions || '["reconciliation"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'reconciliation');
