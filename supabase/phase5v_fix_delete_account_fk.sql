-- ============================================================
-- GoCost — Phase 5v: ปรับปรุงการลบรหัสบัญชี (Fix Delete Account Foreign Key Constraint)
-- แก้ไข error: update or delete on table "accounts" violates foreign key constraint
-- "account_import_lines_account_id_fkey" on table "account_import_lines"
--
-- รันไฟล์นี้ใน Supabase SQL Editor เพื่อให้สามารถลบรหัสบัญชีได้ทันที
-- ============================================================

-- 1. ปรับ foreign key constraint ของ account_import_lines ให้ ON DELETE CASCADE
alter table account_import_lines drop constraint if exists account_import_lines_account_id_fkey;
alter table account_import_lines add constraint account_import_lines_account_id_fkey
  foreign key (account_id) references accounts(id) on delete cascade;

-- 2. ปรับ foreign key constraint ของ expense_records ให้ ON DELETE SET NULL
alter table expense_records drop constraint if exists expense_records_account_id_fkey;
alter table expense_records add constraint expense_records_account_id_fkey
  foreign key (account_id) references accounts(id) on delete set null;

-- 3. อัปเดต function delete_account ให้ปลอดภัยและล้างความเชื่อมโยงก่อนลบเสมอ
create or replace function delete_account(p_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_code text;
  v_name text;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบรหัสบัญชี');
  end if;

  select code, name into v_code, v_name from accounts where id = p_id;
  if v_code is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสบัญชีนี้');
  end if;

  -- ลบรายการนำเข้าที่ผูกกับรหัสนี้
  delete from account_import_lines where account_id = p_id;

  -- ลบการจัดกลุ่มแยก (splits)
  delete from account_group_splits where account_id = p_id;

  -- ลบงบประมาณที่ผูกกับรหัสนี้
  delete from account_budgets where account_id = p_id;

  -- ปลด account_id ในรายการรายจ่ายประวัติ (ไม่ให้กระทบประวัติรายจ่าย)
  update expense_records set account_id = null where account_id = p_id;

  -- ลบรหัสบัญชีจริง
  delete from accounts where id = p_id;

  perform write_audit_log(p_actor_id, 'DELETE_ACCOUNT', 'Accounts',
    format('ลบรหัสบัญชี id: %s (%s — %s)', p_id, v_code, coalesce(v_name, '')));

  return jsonb_build_object('success', true, 'message', format('ลบรหัสบัญชี %s สำเร็จ', v_code));
end;
$$;
