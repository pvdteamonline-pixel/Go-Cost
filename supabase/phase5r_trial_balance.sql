-- ============================================================
-- GoCost — Phase 5r: งบทดลอง (Trial Balance) จริง — แทนที่ mock data ใน TrialBalancePage
-- รันหลัง phase5q_enhancements.sql (หรือไฟล์ล่าสุดที่รันไปแล้ว)
--
-- ใช้ storage เดิมจาก phase5o (account_import_batches / account_import_lines,
-- batch_type='trial_balance' ที่อนุญาตไว้อยู่แล้วในฐานข้อมูล) ไม่ต้องสร้างตารางใหม่
-- ต่างจากไฟล์ "ประมาณการกำไรขาดทุน" ตรงที่:
-- - งบทดลองเป็นภาพนิ่ง ณ ช่วงเวลาหนึ่ง (ไม่ได้มีคอลัมน์ 12 เดือนในไฟล์เดียว)
--   → ผู้ใช้เลือกปี/เดือนเองตอนอัปโหลด แทนที่จะอ่านจากคอลัมน์เดือนในไฟล์
-- - ไม่บังคับ all-or-nothing (งบทดลองมีรหัสบัญชีทั้งบริษัท รวมสินทรัพย์/หนี้สิน
--   ที่ไม่ได้อยู่ในผังบัญชีของเราด้วย) → ข้ามรหัสที่ไม่ตรงไปเงียบๆ ได้ ไม่ error
--   ทั้งไฟล์ (กรองไว้ตั้งแต่ฝั่ง client แล้วก่อนเรียก import_account_file เดิม)
-- ============================================================

-- ─────────────────────────────────────────────
-- get_trial_balance_report — สรุปงบทดลองแยกตามกลุ่ม/รหัสบัญชี พร้อมแยกเดบิท/เครดิต
-- ตามประเภทบัญชี (รายได้ = เครดิต, ค่าใช้จ่าย/อื่นๆ = เดบิท) สำหรับแสดงผลสไตล์งบทดลอง
-- ─────────────────────────────────────────────
create or replace function get_trial_balance_report(p_actor_id text, p_year int, p_month int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_total_debit numeric := 0;
  v_total_credit numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_amount numeric;
  v_debit numeric;
  v_credit numeric;
begin
  if not has_page_permission(p_actor_id, 'trial-balance') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูงบทดลอง');
  end if;

  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    for a in select id, code, name, category from accounts where group_id = g.id order by code loop
      select coalesce(sum(l.amount), 0) into v_amount
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.batch_type = 'trial_balance'
        and b.year = p_year and l.month = p_month;

      if v_amount = 0 then continue; end if;

      if v_amount >= 0 then
        v_debit := v_amount; v_credit := 0;
      else
        v_debit := 0; v_credit := abs(v_amount);
      end if;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'debit', v_debit, 'credit', v_credit
      ));
      v_total_debit := v_total_debit + v_debit;
      v_total_credit := v_total_credit + v_credit;
    end loop;

    if jsonb_array_length(v_group_accounts) > 0 then
      v_groups := v_groups || jsonb_build_array(jsonb_build_object(
        'groupId', g.id, 'code', g.code, 'name', g.name, 'accounts', v_group_accounts
      ));
    end if;
  end loop;

  for a in select id, code, name, category from accounts where group_id is null order by code loop
    select coalesce(sum(l.amount), 0) into v_amount
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id and b.batch_type = 'trial_balance'
      and b.year = p_year and l.month = p_month;

    if v_amount = 0 then continue; end if;

    if v_amount >= 0 then
      v_debit := v_amount; v_credit := 0;
    else
      v_debit := 0; v_credit := abs(v_amount);
    end if;

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'debit', v_debit, 'credit', v_credit
    ));
    v_total_debit := v_total_debit + v_debit;
    v_total_credit := v_total_credit + v_credit;
  end loop;

  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups', v_groups, 'ungroupedAccounts', v_ungrouped,
    'totalDebit', v_total_debit, 'totalCredit', v_total_credit
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_trial_balance_periods — รายชื่องบทดลองที่เคยนำเข้าไว้แล้ว (สำหรับ list ทางซ้าย
-- ของหน้า TrialBalancePage แทนที่ MOCK_TRIAL_BALANCES)
-- ─────────────────────────────────────────────
create or replace function get_trial_balance_periods(p_actor_id text)
returns table (year int, month int, line_count bigint, uploaded_at timestamptz, uploaded_by_name text, file_name text)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'trial-balance') then
    raise exception 'คุณไม่มีสิทธิ์ดูงบทดลอง';
  end if;

  return query
  select b.year, l.month, count(l.id), max(b.uploaded_at), max(u.name), max(b.file_name)
  from account_import_batches b
  join account_import_lines l on l.batch_id = b.id
  left join users u on u.id = b.uploaded_by
  where b.batch_type = 'trial_balance'
  group by b.year, l.month
  order by b.year desc, l.month desc;
end;
$$;

-- ─────────────────────────────────────────────
-- delete_trial_balance_period — ลบงบทดลองของช่วงเวลาหนึ่ง (ลบทุก batch/line ของ
-- ปี-เดือนนั้น) ใช้กับปุ่ม "ลบงบนี้" ในหน้า TrialBalancePage
-- ─────────────────────────────────────────────
create or replace function delete_trial_balance_period(p_actor_id text, p_year int, p_month int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_deleted int;
begin
  if not has_page_permission(p_actor_id, 'trial-balance') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบงบทดลอง');
  end if;

  delete from account_import_lines l
  using account_import_batches b
  where l.batch_id = b.id and b.batch_type = 'trial_balance'
    and b.year = p_year and l.month = p_month;
  get diagnostics v_deleted = row_count;

  -- ลบ batch ที่ไม่มีบรรทัดเหลือแล้ว (กันขยะค้าง)
  delete from account_import_batches b
  where b.batch_type = 'trial_balance' and b.year = p_year
    and not exists (select 1 from account_import_lines l2 where l2.batch_id = b.id);

  perform write_audit_log(p_actor_id, 'DELETE_TRIAL_BALANCE', 'AccountImport',
    format('ลบงบทดลองปี %s เดือน %s (%s รายการ)', p_year, p_month, v_deleted));

  return jsonb_build_object('success', true, 'message', format('ลบงบทดลองสำเร็จ (%s รายการ)', v_deleted));
end;
$$;

-- backfill: ให้ ADMIN มีสิทธิ์ 'trial-balance' และ 'external-expenses' ชัดเจนในรายการ
-- (ไม่จำเป็นเพราะ ADMIN bypass อยู่แล้ว แต่ใส่ไว้ให้ checkbox ในแผงสิทธิ์แสดงถูกต้อง)
update users set page_permissions = page_permissions || '["trial-balance","external-expenses"]'::jsonb
where role = 'ADMIN'
  and not (page_permissions ? 'trial-balance' and page_permissions ? 'external-expenses');
