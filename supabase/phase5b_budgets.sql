-- ============================================================
-- GoCost — Phase 5b: ตั้งงบประมาณ (Budget Cap) แยกตามหมวดหมู่ค่าใช้จ่าย
-- รันหลัง phase5a_accounts_seed.sql
--
-- หมายเหตุการออกแบบ: ตั้งงบตาม "หมวดหมู่ค่าใช้จ่าย" (MAIN_CATEGORIES 7 หมวดที่ใช้
-- ในฟอร์มบันทึกค่าใช้จ่ายจริง เช่น ค่าใช้จ่าย Partner, ค่าใช้จ่าย Workshop) ไม่ใช่
-- "หมวดหมู่บัญชี" ของผังบัญชี (accounts.category ซึ่งมีแค่ 3 ค่ากว้างๆ คือ รายได้/
-- ค่าใช้จ่าย/อื่นๆ) เพราะหมวดที่ใช้บันทึกค่าใช้จ่ายจริงคือตัวที่มีความหมายพอจะตั้ง
-- งบคุมได้ (ตรงกับตัวอย่างที่เคยคุยกันไว้ "Content เท่าไร / Partner เท่าไร")
-- ตั้งเป็นงบรายปีต่อหมวดหมู่ (ไม่แยกรายเดือน เพื่อความง่ายและตรงกับที่ขอ "budget
-- cap ของบริษัท")
-- ============================================================

create table if not exists budgets (
  id          bigint generated always as identity primary key,
  category    text not null,
  year        int not null,
  amount      numeric not null default 0,
  updated_by  text references users(id),
  updated_at  timestamptz not null default now(),
  unique (category, year)
);

alter table budgets enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- get_budgets — คืนงบทุกหมวดของปีที่ระบุ (ต้องมีสิทธิ์ 'budgets' หรือ 'exec-dashboard'
-- เพราะแดชบอร์ดฝ่ายบริหารต้องอ่านค่างบมาเทียบด้วย)
-- ─────────────────────────────────────────────
create or replace function get_budgets(p_actor_id text, p_year int)
returns table (id bigint, category text, year int, amount numeric, updated_at timestamptz)
language plpgsql
security definer
as $$
begin
  if not (has_page_permission(p_actor_id, 'budgets') or has_page_permission(p_actor_id, 'exec-dashboard')) then
    raise exception 'คุณไม่มีสิทธิ์ดูงบประมาณ';
  end if;

  return query
  select b.id, b.category, b.year, b.amount, b.updated_at
  from budgets b
  where b.year = p_year
  order by b.category;
end;
$$;

-- ─────────────────────────────────────────────
-- save_budget — upsert งบต่อหมวดหมู่/ปี (ต้องมีสิทธิ์ 'budgets')
-- ─────────────────────────────────────────────
create or replace function save_budget(p_category text, p_year int, p_amount numeric, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'budgets') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ตั้งงบประมาณ');
  end if;
  if coalesce(trim(p_category), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณาระบุหมวดหมู่');
  end if;
  if p_amount is null or p_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนงบต้องไม่ติดลบ');
  end if;

  insert into budgets (category, year, amount, updated_by, updated_at)
  values (p_category, p_year, p_amount, p_actor_id, now())
  on conflict (category, year)
  do update set amount = excluded.amount, updated_by = excluded.updated_by, updated_at = now();

  perform write_audit_log(p_actor_id, 'SAVE_BUDGET', 'Budgets', format('ตั้งงบ %s ปี %s = %s', p_category, p_year, p_amount));
  return jsonb_build_object('success', true, 'message', 'บันทึกงบประมาณสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- default permission ใหม่: 'budgets' (ตั้งงบ — ADMIN เท่านั้น) และ 'exec-dashboard'
-- (ดูแดชบอร์ดฝ่ายบริหาร — ADMIN + ผู้บริหาร default ให้เลย เพราะทำมาเพื่อฝ่ายนี้)
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
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores","accounts","budgets","exec-dashboard"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve","exec-dashboard"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","accounts"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- backfill: เติมสิทธิ์ใหม่ให้ user เดิม
update users set page_permissions = page_permissions || '["budgets","exec-dashboard"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'budgets' and page_permissions ? 'exec-dashboard');

update users set page_permissions = page_permissions || '["exec-dashboard"]'::jsonb
where role = 'ผู้บริหาร' and not (page_permissions ? 'exec-dashboard');
