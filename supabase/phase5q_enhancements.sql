-- ============================================================
-- GoCost — Phase 5q: Feature Enhancements
-- 1. Budget Control & Sub-limits ( account_budgets )
-- 2. Drill-down: get_group_detail_by_period
-- 3. External Expense Sources scaffold
-- ============================================================

-- ─────────────────────────────────────────────────────────────────
-- 1. ตาราง account_budgets สำหรับตั้งงบรายกลุ่ม / รหัสบัญชีย่อย (sub-limit)
-- ─────────────────────────────────────────────────────────────────
create table if not exists account_budgets (
  id          bigint generated always as identity primary key,
  group_id    bigint references account_groups(id) on delete cascade,
  account_id  bigint references accounts(id) on delete cascade,
  year        int not null,
  month       int, -- null = รายปี, 1-12 = รายเดือน
  amount      numeric not null default 0,
  updated_by  text references users(id),
  updated_at  timestamptz not null default now(),
  constraint chk_budget_target check (group_id is not null or account_id is not null)
);

alter table account_budgets enable row level security;

-- RPC สำหรับตั้งงบกลุ่ม/รหัสบัญชี
create or replace function save_account_budget(
  p_actor_id text,
  p_group_id bigint default null,
  p_account_id bigint default null,
  p_year int default 2026,
  p_month int default null,
  p_amount numeric default 0
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'budgets') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ตั้งงบประมาณ');
  end if;

  if p_amount is null or p_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนงบต้องไม่ติดลบ');
  end if;

  if p_group_id is null and p_account_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาระบุกลุ่มหรือรหัสบัญชี');
  end if;

  if p_group_id is not null then
    insert into account_budgets (group_id, year, month, amount, updated_by, updated_at)
    values (p_group_id, p_year, p_month, p_amount, p_actor_id, now())
    on conflict do nothing; -- fallback index handling in logic or application
    
    update account_budgets 
    set amount = p_amount, updated_by = p_actor_id, updated_at = now()
    where group_id = p_group_id and year = p_year and (month is not distinct from p_month);
  else
    update account_budgets 
    set amount = p_amount, updated_by = p_actor_id, updated_at = now()
    where account_id = p_account_id and year = p_year and (month is not distinct from p_month);

    if not found then
      insert into account_budgets (account_id, year, month, amount, updated_by, updated_at)
      values (p_account_id, p_year, p_month, p_amount, p_actor_id, now());
    end if;
  end if;

  perform write_audit_log(p_actor_id, 'SAVE_ACCOUNT_BUDGET', 'Budgets', format('ตั้งงบปี %s เดือน %s ยอด %s', p_year, coalesce(p_month::text, 'ทั้งปี'), p_amount));
  return jsonb_build_object('success', true, 'message', 'บันทึกงบสำเร็จ');
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 2. Drill-down RPC: get_group_detail_by_period
--    "จิ้มแล้วรู้ว่าใช้จ่ายกับอะไรบ้าง ในเดือน/ปี นั้นๆ"
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_detail_by_period(
  p_actor_id text,
  p_group_id bigint default null,
  p_account_id bigint default null,
  p_year int default 2026,
  p_month int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_lines jsonb := '[]'::jsonb;
  v_total numeric := 0;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'lineId', l.id,
    'accountCode', a.code,
    'accountName', a.name,
    'category', a.category,
    'month', l.month,
    'year', b.year,
    'amount', l.amount,
    'batchId', b.id,
    'fileName', b.file_name,
    'importedAt', b.imported_at
  ) order by a.code, l.month), '[]'::jsonb),
  coalesce(sum(l.amount), 0)
  into v_lines, v_total
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a on a.id = l.account_id
  where b.batch_type = 'pl_estimate'
    and b.year = p_year
    and (p_month is null or l.month = p_month)
    and (
      (p_group_id is not null and a.group_id = p_group_id)
      or (p_account_id is not null and a.id = p_account_id)
      or (p_group_id is null and p_account_id is null)
    );

  return jsonb_build_object(
    'success', true,
    'year', p_year,
    'month', p_month,
    'total', v_total,
    'items', v_lines
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 3. รองรับยอดค่าใช้จ่ายภายนอก ( External Expense Sources )
-- ─────────────────────────────────────────────────────────────────
create table if not exists external_expense_sources (
  id          bigint generated always as identity primary key,
  source_code text not null unique,
  source_name text not null, -- เช่น 'บิวเทรียม (Beautrium)', 'Shopee', 'Lazada'
  channel     text default 'online',
  is_active   boolean default true,
  note        text,
  created_at  timestamptz default now()
);

create table if not exists external_expense_imports (
  id           bigint generated always as identity primary key,
  source_id    bigint references external_expense_sources(id) on delete cascade,
  batch_label  text,
  year         int not null,
  month        int not null,
  total_amount numeric default 0,
  raw_payload  jsonb,
  imported_by  text references users(id),
  imported_at  timestamptz default now()
);

alter table external_expense_sources enable row level security;
alter table external_expense_imports enable row level security;

-- Seed ข้อมูลช่องทางภายนอกเริ่มต้น
insert into external_expense_sources (source_code, source_name, channel, note)
values 
  ('BEAUTRIUM', 'บิวเทรียม (Beautrium)', 'retail', 'ยอดค่าใช้จ่าย/ค่าคอมมินชัน/ค่าเช่าพื้นที่ บิวเทรียม'),
  ('ECOM_SHOPEE', 'Shopee Official Store', 'online', 'ค่าธรรมเนียมและค่าบริการ Shopee'),
  ('ECOM_LAZADA', 'Lazada Official Store', 'online', 'ค่าธรรมเนียมและค่าบริการ Lazada'),
  ('TIKTOK_SHOP', 'TikTok Shop', 'online', 'ค่าโฆษณาและค่าธรรมเนียม TikTok Shop')
on conflict (source_code) do nothing;

create or replace function get_external_sources(p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sources jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'code', s.source_code,
    'name', s.source_name,
    'channel', s.channel,
    'isActive', s.is_active,
    'note', s.note
  ) order by s.id), '[]'::jsonb)
  into v_sources
  from external_expense_sources s;

  return jsonb_build_object('success', true, 'sources', v_sources);
end;
$$;
