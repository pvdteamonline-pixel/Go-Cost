-- ============================================================
-- GoCost: SQL รวมสำหรับ run เข้า Supabase (copy-paste ทีเดียว)
-- ครอบคลุม: phase5i + phase5l + phase5o
-- วิธีใช้: เปิด Supabase Dashboard > SQL Editor > วางทั้งหมด > Run
-- ============================================================

-- === PHASE 5i ===
-- ============================================================
-- GoCost โ€” Phase 5i: เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฒเธกเธ—เธตเนเธเธญ
-- เธฃเธฑเธเธซเธฅเธฑเธ phase5h_reports.sql
--
-- 1. get_group_report โ€” เธ”เธนเธขเธญเธ”เธเธญเธเธเธฅเธธเนเธก (เนเธกเน) เธเธฃเนเธญเธกเธขเธญเธ”เนเธขเธเธ•เธฒเธกเธฃเธซเธฑเธชเธเธฑเธเธเธต (เธฅเธนเธ) เนเธ•เนเธฅเธฐเธ•เธฑเธง
--    เธเธฃเธญเธเธ•เธฒเธกเน€เธ”เธทเธญเธ/เธเธตเนเธ”เน เนเธเนเนเธเธซเธเนเธฒ "เธเธฅเธธเนเธกเธฃเธซเธฑเธชเธเธฑเธเธเธต"
-- 2. get_executive_itemized_report โ€” เน€เธเธฅเธตเนเธขเธเน€เธเนเธเธชเธฃเธธเธเธขเธญเธ”เธ•เธฒเธกเธเธฅเธธเนเธกเน€เธ—เนเธฒเธเธฑเนเธ (เนเธกเนเนเธเธงเน
--    เธฃเธฒเธขเธเธฒเธฃเธขเนเธญเธขเธฃเธฐเธ”เธฑเธเนเธเน€เธชเธฃเนเธเธญเธตเธเธ•เนเธญเนเธ) + เน€เธเธดเนเธก filter เน€เธ”เธทเธญเธ
-- 3. get_tax_filing_report โ€” เน€เธเธดเนเธกเธฃเธฒเธขเธเธฒเธฃเธขเนเธญเธขเธฃเธฐเธ”เธฑเธเนเธเน€เธชเธฃเนเธเนเธเนเธ•เนเธฅเธฐเธฃเธซเธฑเธชเธเธฑเธเธเธต (เธ•เธฃเธเธเนเธฒเธก
--    เธเธฑเธเธเนเธญ 2 โ€” เธฃเธฒเธขเธเธฒเธเธเธตเนเธ•เนเธญเธเนเธเธเนเธเธเธฅเธฐเน€เธญเธตเธขเธ”เธชเธณเธซเธฃเธฑเธเธชเนเธเธเธฃเธกเธชเธฃเธฃเธเธฒเธเธฃ)
-- ============================================================

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_group_report โ€” เน€เธเนเธ "เธซเธกเธงเธ”เธฃเธฒเธขเนเธ”เน 4000-00" เนเธฅเนเธงเนเธเธเนเธเธเธขเธญเธ”เนเธ•เนเธฅเธฐเธฃเธซเธฑเธชเธฅเธนเธเนเธเธเธฅเธธเนเธกเธเธฑเนเธ
-- เธ•เธฒเธก filter เน€เธ”เธทเธญเธ/เธเธตเธ—เธตเนเน€เธฅเธทเธญเธ (เธเธตเธเธฑเธเธเธฑเธ, เน€เธ”เธทเธญเธเนเธกเนเธเธฑเธเธเธฑเธ โ€” เนเธกเนเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ = เธ—เธฑเนเธเธเธต)
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
create or replace function get_group_report(p_actor_id text, p_group_id bigint, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group record;
  v_members jsonb := '[]'::jsonb;
  v_group_total numeric := 0;
  a record;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธฃเธฒเธขเธเธฒเธเธเธฅเธธเนเธกเธเธตเน');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'เนเธกเนเธเธเธเธฅเธธเนเธกเธเธตเน');
  end if;

  for a in select id, code, name from accounts where group_id = p_group_id order by code loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_members := v_members || jsonb_build_array(jsonb_build_object(
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


drop function if exists get_executive_itemized_report(text, int);
create or replace function get_executive_itemized_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_unassigned_total numeric;
  v_grand_total numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total numeric;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธฃเธฒเธขเธเธฒเธเธเธตเน');
  end if;

  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total := 0;
    for a in select id, code, name from accounts where group_id = g.id order by code loop
      select coalesce(sum(e.total), 0) into v_account_total
      from expense_records e
      where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month);

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

  for a in select id, code, name from accounts where group_id is null order by code loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  select coalesce(sum(e.total), 0) into v_unassigned_total
  from expense_records e
  where e.account_id is null and e.main_category <> 'เธฃเธฒเธขเนเธ”เน'
    and extract(year from e.event_date) = p_year
    and (p_month is null or extract(month from e.event_date) = p_month);

  v_grand_total := v_grand_total + v_unassigned_total;

  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassignedTotal', v_unassigned_total,
    'grandTotal', v_grand_total
  );
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_tax_filing_report โ€” เน€เธเธดเนเธกเธฃเธฒเธขเธเธฒเธฃเธขเนเธญเธขเธฃเธฐเธ”เธฑเธเนเธเน€เธชเธฃเนเธเนเธเนเธ•เนเธฅเธฐเธฃเธซเธฑเธช (เนเธเธเนเธเธเธฅเธฐเน€เธญเธตเธขเธ”)
-- เธ•เนเธญเธ drop เธเนเธญเธเน€เธเธฃเธฒเธฐเนเธเธฃเธเธชเธฃเนเธฒเธ jsonb เธเธฅเธฅเธฑเธเธเนเน€เธเธฅเธตเนเธขเธ (เน€เธเธดเนเธก lines[].items[])
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
drop function if exists get_tax_filing_report(text, int);
create or replace function get_tax_filing_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_by_category jsonb := '[]'::jsonb;
  v_net numeric := 0;
  cat record;
  acct record;
  v_items jsonb;
  v_acct_total numeric;
  v_lines jsonb;
  v_cat_total numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธฃเธฒเธขเธเธฒเธเธเธตเน');
  end if;

  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans where status = 'completed' and extract(year from planned_date) = p_year;

  for cat in
    select distinct a.category from accounts a
    join expense_records e on e.account_id = a.id
    where extract(year from e.event_date) = p_year
    order by a.category
  loop
    v_lines := '[]'::jsonb;
    v_cat_total := 0;

    for acct in
      select distinct a.id, a.code, a.name from accounts a
      join expense_records e on e.account_id = a.id
      where a.category = cat.category and extract(year from e.event_date) = p_year
      order by a.code
    loop
      select coalesce(jsonb_agg(jsonb_build_object(
               'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
               'detail', e.detail, 'qty', e.qty, 'unitPrice', e.unit_price, 'total', e.total
             ) order by e.event_date), '[]'::jsonb),
             coalesce(sum(e.total), 0)
      into v_items, v_acct_total
      from expense_records e
      where e.account_id = acct.id and extract(year from e.event_date) = p_year;

      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'code', acct.code, 'name', acct.name, 'total', v_acct_total, 'items', v_items
      ));
      v_cat_total := v_cat_total + v_acct_total;
    end loop;

    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
  end loop;

  select coalesce(sum(e.total), 0) into v_net
  from expense_records e
  where e.account_id is not null and extract(year from e.event_date) = p_year;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'totalRevenue', v_total_revenue,
    'totalExpenses', v_net,
    'netIncome', v_total_revenue - v_net,
    'byCategory', v_by_category
  );
end;
$$;

-- === PHASE 5l ===
-- ============================================================
-- GoCost โ€” Phase 5l: เธฃเธญเธเธฃเธฑเธเธฃเธซเธฑเธชเธเธฑเธเธเธต 1 เธ•เธฑเธงเนเธเนเธเธชเธฑเธ”เธชเนเธงเธเธญเธขเธนเนเธซเธฅเธฒเธขเธเธฅเธธเนเธกเนเธ”เน
-- เธฃเธฑเธเธซเธฅเธฑเธ phase5k_reconciliation.sql
--
-- เน€เธเธฅเธตเนเธขเธเธเธฒเธ accounts.group_id (1 เธฃเธซเธฑเธช = 1 เธเธฅเธธเนเธกเน€เธ—เนเธฒเธเธฑเนเธ) เน€เธเนเธเธ•เธฒเธฃเธฒเธ
-- account_group_splits (1 เธฃเธซเธฑเธช = เธซเธฅเธฒเธขเธเธฅเธธเนเธก เธเธฃเนเธญเธกเธชเธฑเธ”เธชเนเธงเธ % เธเธญเธเนเธ•เนเธฅเธฐเธเธฅเธธเนเธก)
-- เธ•เธฑเธงเธญเธขเนเธฒเธเธเธฃเธดเธเธเธฒเธเนเธเธฅเน P&L: เธฃเธซเธฑเธช 6120-14 เนเธเนเธ 1/3 เนเธซเนเธเธฅเธธเนเธกเธเธฒเธข, 2/3 เนเธซเนเธเธฅเธธเนเธกเธเธฃเธดเธซเธฒเธฃ
--
-- เธเธ•เธดเธเธฒเธเธงเธฒเธกเธ–เธนเธเธ•เนเธญเธ (เธขเธญเธ”เธชเธณเธเธฑเธเธกเธฒเธ เธซเนเธฒเธกเธเธดเธ”เธเธฅเธฒเธ”):
-- - เธชเธฑเธ”เธชเนเธงเธเธฃเธงเธกเธเธญเธ 1 เธฃเธซเธฑเธชเธเธฑเธเธเธต เธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100% (เธฃเธฐเธเธเน€เธเนเธเนเธซเนเธ—เธธเธเธเธฃเธฑเนเธเธ—เธตเนเนเธเนเนเธ)
-- - เธ–เนเธฒเธฃเธซเธฑเธชเธเธฑเธเธเธตเธกเธตเธชเธฑเธ”เธชเนเธงเธเนเธกเนเธเธฃเธ 100% เธชเนเธงเธเธ—เธตเนเน€เธซเธฅเธทเธญเธเธฐเธ–เธนเธเนเธขเธเนเธเธงเนเน€เธเนเธ "เธขเธฑเธเนเธกเนเนเธ”เนเธเธฑเธ”เธชเธฃเธฃ
--   เธเธฒเธเธชเนเธงเธ" เนเธเธฃเธฒเธขเธเธฒเธ เนเธกเนเธเธฑเธ”เธ•เธเธซเธฒเธขเนเธเน€เธเธตเธขเธเน เน€เธเธทเนเธญเนเธซเนเธขเธญเธ”เธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ”เธ•เธฃเธเธเธฑเธเธเธงเธฒเธกเน€เธเนเธเธเธฃเธดเธเน€เธชเธกเธญ
-- ============================================================

create table if not exists account_group_splits (
  id         bigint generated always as identity primary key,
  account_id bigint not null references accounts(id) on delete cascade,
  group_id   bigint not null references account_groups(id) on delete cascade,
  fraction   numeric not null check (fraction > 0 and fraction <= 1),
  unique (account_id, group_id)
);

alter table account_group_splits enable row level security;
-- เนเธกเนเธชเธฃเนเธฒเธ policy เนเธซเน client เธ•เธฃเธเน เน€เธซเธกเธทเธญเธเธ•เธฒเธฃเธฒเธเธญเธทเนเธเธ—เธฑเนเธเธซเธกเธ” โ€” เน€เธเนเธฒเธ–เธถเธเธเนเธฒเธ RPC เน€เธ—เนเธฒเธเธฑเนเธ

-- เธขเนเธฒเธขเธเนเธญเธกเธนเธฅเน€เธ”เธดเธกเธเธฒเธ accounts.group_id (1:1) เธกเธฒเน€เธเนเธ split เนเธเธ 100% เนเธซเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด
insert into account_group_splits (account_id, group_id, fraction)
select id, group_id, 1.0 from accounts where group_id is not null
on conflict (account_id, group_id) do nothing;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- set_account_group_split โ€” เน€เธเธดเนเธก/เนเธเนเนเธเธชเธฑเธ”เธชเนเธงเธเธเธญเธเธฃเธซเธฑเธชเธเธฑเธเธเธตเธซเธเธถเนเธเธ•เธฑเธงเนเธเธเธฅเธธเนเธกเธซเธเธถเนเธ
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
create or replace function set_account_group_split(
  p_actor_id text, p_account_id bigint, p_group_id bigint, p_fraction numeric
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_existing_total numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธเธฑเธ”เธเธฒเธฃเธเธฅเธธเนเธกเธฃเธซเธฑเธชเธเธฑเธเธเธต');
  end if;
  if p_fraction is null or p_fraction <= 0 or p_fraction > 1 then
    return jsonb_build_object('success', false, 'message', 'เธชเธฑเธ”เธชเนเธงเธเธ•เนเธญเธเธกเธฒเธเธเธงเนเธฒ 0% เนเธฅเธฐเนเธกเนเน€เธเธดเธ 100%');
  end if;

  select coalesce(sum(fraction), 0) into v_existing_total
  from account_group_splits
  where account_id = p_account_id and group_id <> p_group_id;

  if v_existing_total + p_fraction > 1.0001 then
    return jsonb_build_object('success', false, 'message',
      format('เธชเธฑเธ”เธชเนเธงเธเธฃเธงเธกเน€เธเธดเธ 100%% โ€” เธฃเธซเธฑเธชเธเธตเนเธ–เธนเธเธเธฑเธ”เธชเธฃเธฃเนเธเนเธฅเนเธง %s%% เนเธเธเธฅเธธเนเธกเธญเธทเนเธ เน€เธซเธฅเธทเธญเนเธซเนเนเธชเนเนเธ”เนเนเธกเนเน€เธเธดเธ %s%%',
        round(v_existing_total * 100, 1), round((1 - v_existing_total) * 100, 1)));
  end if;

  insert into account_group_splits (account_id, group_id, fraction)
  values (p_account_id, p_group_id, p_fraction)
  on conflict (account_id, group_id) do update set fraction = excluded.fraction;

  perform write_audit_log(p_actor_id, 'SET_ACCOUNT_GROUP_SPLIT', 'AccountGroups',
    format('เธฃเธซเธฑเธชเธเธฑเธเธเธต id %s โ’ เธเธฅเธธเนเธก id %s เธชเธฑเธ”เธชเนเธงเธ %s%%', p_account_id, p_group_id, round(p_fraction * 100, 1)));

  return jsonb_build_object('success', true, 'message', 'เธเธฑเธเธ—เธถเธเธชเธฑเธ”เธชเนเธงเธเธชเธณเน€เธฃเนเธ');
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- remove_account_group_split โ€” เน€เธญเธฒเธฃเธซเธฑเธชเธเธฑเธเธเธตเธญเธญเธเธเธฒเธเธเธฅเธธเนเธกเธซเธเธถเนเธ (เธฅเธ split เน€เธเธเธฒเธฐเธเธนเนเธเธตเน)
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
create or replace function remove_account_group_split(p_actor_id text, p_account_id bigint, p_group_id bigint)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธเธฑเธ”เธเธฒเธฃเธเธฅเธธเนเธกเธฃเธซเธฑเธชเธเธฑเธเธเธต');
  end if;

  delete from account_group_splits where account_id = p_account_id and group_id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธตเน');
  end if;

  perform write_audit_log(p_actor_id, 'REMOVE_ACCOUNT_GROUP_SPLIT', 'AccountGroups',
    format('เน€เธญเธฒเธฃเธซเธฑเธชเธเธฑเธเธเธต id %s เธญเธญเธเธเธฒเธเธเธฅเธธเนเธก id %s', p_account_id, p_group_id));

  return jsonb_build_object('success', true, 'message', 'เน€เธญเธฒเธญเธญเธเธเธฒเธเธเธฅเธธเนเธกเธชเธณเน€เธฃเนเธ');
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_group_members โ€” เน€เธเธฅเธตเนเธขเธเน€เธเนเธเนเธชเธ”เธเธชเธฑเธ”เธชเนเธงเธ (fraction) เธเธญเธเนเธ•เนเธฅเธฐเธชเธกเธฒเธเธดเธ + เนเธเธงเน
-- % เธ—เธตเนเธ–เธนเธเธเธฑเธ”เธชเธฃเธฃเนเธเนเธฅเนเธงเนเธเธเธฅเธธเนเธกเธญเธทเนเธเธเธญเธเธฃเธซเธฑเธชเธ—เธตเนเธขเธฑเธเนเธกเนเนเธ”เนเธญเธขเธนเนเนเธเธเธฅเธธเนเธกเธเธตเน
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
drop function if exists get_group_members(text, bigint);
create or replace function get_group_members(p_actor_id text, p_group_id bigint)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_members jsonb;
  v_available jsonb;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธเธฅเธธเนเธกเธฃเธซเธฑเธชเธเธฑเธเธเธต');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'code', a.code, 'name', a.name, 'fraction', s.fraction
         ) order by a.code), '[]'::jsonb)
  into v_members
  from account_group_splits s
  join accounts a on a.id = s.account_id
  where s.group_id = p_group_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'code', a.code, 'name', a.name,
           'allocatedElsewhere', coalesce(other.total_fraction, 0)
         ) order by a.code), '[]'::jsonb)
  into v_available
  from accounts a
  left join (
    select account_id, sum(fraction) as total_fraction
    from account_group_splits
    group by account_id
  ) other on other.account_id = a.id
  where not exists (
    select 1 from account_group_splits s2 where s2.account_id = a.id and s2.group_id = p_group_id
  );

  return jsonb_build_object('success', true, 'members', v_members, 'available', v_available);
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_accounts โ€” เน€เธเธฅเธตเนเธขเธเธเธญเธฅเธฑเธกเธเน group_id/group_name เน€เธ”เธตเนเธขเธง เน€เธเนเธ groups[] (array
-- เธเธญเธเธเธฅเธธเนเธกเธ—เธตเนเธฃเธซเธฑเธชเธเธตเนเธ–เธนเธเธเธฑเธ”เธชเธฃเธฃเธญเธขเธนเน เธเธฃเนเธญเธกเธชเธฑเธ”เธชเนเธงเธ)
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
drop function if exists get_accounts(text, text);
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns table (
  id bigint, code text, name text, category text, description text,
  groups jsonb, created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธฃเธซเธฑเธชเธเธฑเธเธเธต';
  end if;

  return query
  select a.id, a.code, a.name, a.category, a.description,
         coalesce((
           select jsonb_agg(jsonb_build_object('groupId', g.id, 'code', g.code, 'name', g.name, 'fraction', s.fraction) order by g.code)
           from account_group_splits s join account_groups g on g.id = s.group_id
           where s.account_id = a.id
         ), '[]'::jsonb) as groups,
         a.created_at, a.updated_at
  from accounts a
  where p_query is null or trim(p_query) = ''
     or a.code ilike '%' || p_query || '%'
     or a.name ilike '%' || p_query || '%'
     or a.category ilike '%' || p_query || '%'
  order by a.code;
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_group_report โ€” เธเธนเธ“เธขเธญเธ”เธเธฃเธดเธเธเธญเธเนเธ•เนเธฅเธฐเธฃเธซเธฑเธชเธ”เนเธงเธขเธชเธฑเธ”เธชเนเธงเธ (fraction) เธเนเธญเธเธฃเธงเธกเน€เธเนเธเธขเธญเธ”เธเธฅเธธเนเธก
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
create or replace function get_group_report(p_actor_id text, p_group_id bigint, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group record;
  v_members jsonb := '[]'::jsonb;
  v_group_total numeric := 0;
  m record;
  v_account_total numeric;
  v_allocated numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธฃเธฒเธขเธเธฒเธเธเธฅเธธเนเธกเธเธตเน');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'เนเธกเนเธเธเธเธฅเธธเนเธกเธเธตเน');
  end if;

  for m in
    select a.id, a.code, a.name, s.fraction
    from account_group_splits s join accounts a on a.id = s.account_id
    where s.group_id = p_group_id order by a.code
  loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = m.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_allocated := v_account_total * m.fraction;

    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'code', m.code, 'name', m.name, 'fraction', m.fraction,
      'accountTotal', v_account_total, 'allocatedTotal', v_allocated
    ));
    v_group_total := v_group_total + v_allocated;
  end loop;

  return jsonb_build_object(
    'success', true,
    'groupCode', v_group.code, 'groupName', v_group.name,
    'year', p_year, 'month', p_month,
    'members', v_members, 'groupTotal', v_group_total
  );
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_executive_itemized_report โ€” fraction-weighting + เนเธขเธเนเธเธงเน "เธขเธฑเธเนเธกเนเนเธ”เนเธเธฑเธ”เธชเธฃเธฃ
-- เธเธฒเธเธชเนเธงเธ" เธเธญเธเธฃเธซเธฑเธชเธ—เธตเนเธชเธฑเธ”เธชเนเธงเธเธฃเธงเธกเนเธกเนเธ–เธถเธ 100% เน€เธเธทเนเธญเนเธซเน grandTotal เธ•เธฃเธเธเธฑเธเธขเธญเธ”เนเธเนเธเนเธฒเธขเธเธฃเธดเธ
-- เธ—เธฑเนเธเธซเธกเธ”เน€เธชเธกเธญ
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
create or replace function get_executive_itemized_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_partial jsonb := '[]'::jsonb;
  v_unassigned_total numeric;
  v_grand_total numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total numeric;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธฃเธฒเธขเธเธฒเธเธเธตเน');
  end if;

  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total := 0;
    for a in
      select acc.id, acc.code, acc.name, s.fraction
      from account_group_splits s join accounts acc on acc.id = s.account_id
      where s.group_id = g.id order by acc.code
    loop
      select coalesce(sum(e.total), 0) into v_account_total
      from expense_records e
      where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month);

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'fraction', a.fraction, 'total', v_account_total * a.fraction
      ));
      v_group_total := v_group_total + (v_account_total * a.fraction);
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'total', v_group_total, 'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  for a in
    select acc.id, acc.code, acc.name from accounts acc
    where not exists (select 1 from account_group_splits s where s.account_id = acc.id)
    order by acc.code
  loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object('code', a.code, 'name', a.name, 'total', v_account_total));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  for a in
    select acc.id, acc.code, acc.name, sum(s.fraction) as total_fraction
    from account_group_splits s join accounts acc on acc.id = s.account_id
    group by acc.id, acc.code, acc.name
    having sum(s.fraction) < 0.9999
    order by acc.code
  loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_partial := v_partial || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name,
      'allocatedFraction', a.total_fraction,
      'unallocatedTotal', v_account_total * (1 - a.total_fraction)
    ));
    v_grand_total := v_grand_total + (v_account_total * (1 - a.total_fraction));
  end loop;

  select coalesce(sum(e.total), 0) into v_unassigned_total
  from expense_records e
  where e.account_id is null and e.main_category <> 'เธฃเธฒเธขเนเธ”เน'
    and extract(year from e.event_date) = p_year
    and (p_month is null or extract(month from e.event_date) = p_month);

  v_grand_total := v_grand_total + v_unassigned_total;

  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped,
    'partialAccounts', v_partial,
    'unassignedTotal', v_unassigned_total,
    'grandTotal', v_grand_total
  );
end;
$$;

-- === PHASE 5n ===
-- ============================================================
-- GoCost โ€” Phase 5n: เธฅเธเธเธฅเธธเนเธกเธ—เธตเนเธชเธฃเนเธฒเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเนเธเน€เธเธช 5m เธ—เธฑเนเธเธซเธกเธ”
-- เธฃเธฑเธเธซเธฅเธฑเธ phase5m_group_seed_from_pl.sql
--
-- เธ•เธฒเธกเธ—เธตเนเธเธญ โ€” เธฅเธเธเธฅเธธเนเธก GRP-01 เธ–เธถเธ GRP-16 เนเธฅเธฐเธเธฒเธฃเธเธฑเธ”เธชเธฃเธฃเธ—เธฑเนเธเธซเธกเธ”เธ—เธตเนเธกเธฒเธเธฃเนเธญเธกเธเธฑเธ
-- (account_group_splits เธฅเธเธ•เธฒเธกเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธ”เนเธงเธข on delete cascade) เธฃเธฐเธเธเน€เธเธดเนเธก/เนเธเนเนเธ/เธฅเธ
-- เธเธฅเธธเนเธกเนเธฅเธฐ assign เธฃเธซเธฑเธชเธเธฑเธเธเธตเน€เธเนเธฒเธเธฅเธธเนเธกเธขเธฑเธเนเธเนเธเธฒเธเนเธ”เนเธเธเธ•เธดเธ—เธธเธเธญเธขเนเธฒเธเธ—เธตเนเธซเธเนเธฒ "เธเธฅเธธเนเธกเธฃเธซเธฑเธชเธเธฑเธเธเธต"
-- โ€” เนเธเนเนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเธ•เธฑเนเธเธ•เนเธเนเธฅเนเธง เนเธซเนเธชเธฃเนเธฒเธเน€เธญเธเธ—เธฑเนเธเธซเธกเธ”
-- ============================================================

delete from account_groups where code like 'GRP-%';

-- === PHASE 5o ===
-- ============================================================
-- GoCost โ€” Phase 5o: เนเธเธเนเธเธฅเนเน€เธซเธฅเธทเธญเนเธเธเน€เธ”เธตเธขเธง "เธเธฃเธฐเธกเธฒเธ“เธเธฒเธฃเธเธณเนเธฃเธเธฒเธ”เธ—เธธเธ" (เธซเธฅเธฒเธขเน€เธ”เธทเธญเธเนเธเนเธเธฅเนเน€เธ”เธตเธขเธง)
-- เธฃเธฑเธเธซเธฅเธฑเธ phase5n_revert_auto_groups.sql
--
-- เนเธ—เธเธ—เธตเนเธ”เธตเนเธเธเนเน€เธ”เธดเธก (เธเธเธ—เธ”เธฅเธญเธ + เนเธเธฅเนเธฃเธฒเธขเธเนเธฒเธข เนเธขเธ 2 เธเธฃเธฐเน€เธ เธ—, 1 batch = 1 เน€เธ”เธทเธญเธ)
-- เธ”เนเธงเธขเนเธเธฅเนเน€เธ”เธตเธขเธงเธ—เธตเนเธซเธฑเธงเธซเธเนเธฒเธเนเธฒเธขเธเธฑเธเธเธตเธญเธฑเธเนเธซเธฅเธ” เธเธถเนเธเธกเธตเธเนเธญเธกเธนเธฅเธซเธฅเธฒเธขเน€เธ”เธทเธญเธเนเธเนเธเธฅเนเน€เธ”เธตเธขเธง
-- (เธเธญเธฅเธฑเธกเธเนเน€เธ”เธทเธญเธ เธก.เธ., เธ.เธ., ... เนเธเธเธตเธ•เน€เธ”เธตเธขเธง) โ€” เน€เธเนเธเน€เธ”เธทเธญเธเนเธงเนเธ—เธตเนเธฃเธฐเธ”เธฑเธ "เธเธฃเธฃเธ—เธฑเธ”" เนเธ—เธ
-- เธฃเธฐเธ”เธฑเธ "เนเธเธฅเน" เน€เธเธทเนเธญเธฃเธญเธเธฃเธฑเธเธซเธฅเธฒเธขเน€เธ”เธทเธญเธเธ•เนเธญเธเธฒเธฃเธญเธฑเธเนเธซเธฅเธ” 1 เธเธฃเธฑเนเธ
-- ============================================================

alter table account_import_lines add column if not exists month int;

alter table account_import_batches drop constraint if exists account_import_batches_batch_type_check;
alter table account_import_batches add constraint account_import_batches_batch_type_check
  check (batch_type in ('trial_balance', 'expense_file', 'pl_estimate'));

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- import_account_file โ€” เธฃเธญเธเธฃเธฑเธเธซเธฅเธฒเธขเน€เธ”เธทเธญเธเธ•เนเธญเนเธเธฅเน: เนเธ•เนเธฅเธฐเนเธ–เธงเนเธ p_rows เธกเธต month เธเธญเธ
-- เธ•เธฑเธงเน€เธญเธ (เนเธกเนเนเธเน p_month เธฃเธฐเธ”เธฑเธเนเธเธฅเนเธญเธตเธเธ•เนเธญเนเธ) โ€” เธ•เนเธญเธ drop เธเนเธญเธเน€เธเธฃเธฒเธฐเน€เธเธฅเธตเนเธขเธ signature
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
drop function if exists import_account_file(text, text, int, int, text, jsonb);
create or replace function import_account_file(
  p_actor_id text, p_batch_type text, p_year int, p_file_name text, p_rows jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_id bigint;
  v_row jsonb;
  v_code text;
  v_account_id bigint;
  v_count int := 0;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธเธณเน€เธเนเธฒเนเธเธฅเนเธเธฑเธเธเธต');
  end if;
  if p_batch_type not in ('trial_balance', 'expense_file', 'pl_estimate') then
    return jsonb_build_object('success', false, 'message', 'เธเธฃเธฐเน€เธ เธ—เนเธเธฅเนเนเธกเนเธ–เธนเธเธ•เนเธญเธ');
  end if;
  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return jsonb_build_object('success', false, 'message', 'เนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเนเธซเนเธเธณเน€เธเนเธฒ');
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null or not exists (select 1 from accounts where code = v_code) then
      return jsonb_build_object('success', false, 'message',
        format('เธฃเธซเธฑเธชเธเธฑเธเธเธต %s เนเธกเนเธกเธตเนเธเธฃเธฐเธเธ เธเธฃเธธเธ“เธฒเน€เธเธดเนเธกเนเธเธซเธเนเธฒ "เธเธฑเธ”เธเธฒเธฃเธฃเธซเธฑเธชเธเธฑเธเธเธต" เธเนเธญเธ เนเธฅเนเธงเธเธณเน€เธเนเธฒเนเธซเธกเน', coalesce(v_code, '(เธงเนเธฒเธ)')));
    end if;
  end loop;

  insert into account_import_batches (batch_type, year, month, file_name, uploaded_by)
  values (p_batch_type, p_year, null, p_file_name, p_actor_id)
  returning id into v_batch_id;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := trim(v_row->>'code');
    select id into v_account_id from accounts where code = v_code;
    insert into account_import_lines (batch_id, account_id, code, amount, month, description)
    values (
      v_batch_id, v_account_id, v_code, (v_row->>'amount')::numeric,
      nullif(v_row->>'month', '')::int,
      nullif(trim(coalesce(v_row->>'description', '')), '')
    );
    v_count := v_count + 1;
  end loop;

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNT_FILE', 'AccountImport',
    format('เธเธณเน€เธเนเธฒเนเธเธฅเนเธเธฃเธฐเธกเธฒเธ“เธเธฒเธฃเธเธณเนเธฃเธเธฒเธ”เธ—เธธเธ (%s) %s เธฃเธฒเธขเธเธฒเธฃ เธเธต %s',
      coalesce(p_file_name, '(เนเธกเนเธ—เธฃเธฒเธเธเธทเนเธญเนเธเธฅเน)'), v_count, p_year));

  return jsonb_build_object('success', true, 'message', format('เธเธณเน€เธเนเธฒเธชเธณเน€เธฃเนเธ %s เธฃเธฒเธขเธเธฒเธฃ', v_count), 'batchId', v_batch_id, 'imported', v_count);
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_import_batches โ€” เน€เธเธฅเธตเนเธขเธเนเธซเนเนเธเธงเนเธเนเธงเธเน€เธ”เธทเธญเธเธ—เธตเนเธกเธตเธเนเธญเธกเธนเธฅ (min-max month เธเธญเธ line
-- เนเธเธเธฑเนเธ) เนเธ—เธ month เธฃเธฐเธ”เธฑเธเนเธเธฅเนเน€เธ”เธตเนเธขเธง
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
drop function if exists get_import_batches(text, text);
create or replace function get_import_batches(p_actor_id text, p_batch_type text default null)
returns table (
  id bigint, batch_type text, year int, month_range text, file_name text,
  uploaded_by text, uploaded_by_name text, uploaded_at timestamptz, line_count bigint, total_amount numeric
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒเนเธเธฅเนเธเธฑเธเธเธต';
  end if;

  return query
  select b.id, b.batch_type, b.year,
         case when min(l.month) is null then '-'
              when min(l.month) = max(l.month) then min(l.month)::text
              else min(l.month)::text || '-' || max(l.month)::text end,
         b.file_name, b.uploaded_by, u.name,
         b.uploaded_at, count(l.id), coalesce(sum(l.amount), 0)
  from account_import_batches b
  left join users u on u.id = b.uploaded_by
  left join account_import_lines l on l.batch_id = b.id
  where p_batch_type is null or b.batch_type = p_batch_type
  group by b.id, u.name
  order by b.uploaded_at desc
  limit 100;
end;
$$;

-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
-- get_reconciliation_report โ€” เธญเธฑเธเน€เธ”เธ•เนเธซเนเธ”เธถเธเธขเธญเธ”เธเธฒเธเนเธเธฅเนเธ•เธฒเธก month เธฃเธฐเธ”เธฑเธ line เนเธ—เธ
-- batch.month (logic เน€เธเธฅเธตเนเธขเธ เนเธกเน signature เน€เธ”เธดเธก)
-- โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
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
    return jsonb_build_object('success', false, 'message', 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเธ”เธนเธฃเธฒเธขเธเธฒเธเน€เธ—เธตเธขเธเธขเธญเธ”');
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
      where l.account_id = a.id and b.year = p_year
        and (p_month is null or l.month = p_month)
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
    where l.account_id = a.id and b.year = p_year
      and (p_month is null or l.month = p_month);

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name,
      'staffAmount', v_staff_amount, 'fileAmount', v_file_amount,
      'diff', v_file_amount - v_staff_amount
    ));
  end loop;

  return jsonb_build_object('success', true, 'year', p_year, 'month', p_month, 'rows', v_rows);
end;
$$;

