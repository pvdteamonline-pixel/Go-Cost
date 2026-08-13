-- ============================================================
-- GoCost: SQL รวมสำหรับ run เข้า Supabase (copy-paste ทีเดียว)
-- ครอบคลุม: phase5i + phase5l + phase5o + phase5p + phase5q + phase5s
-- วิธีใช้: เปิด Supabase Dashboard > SQL Editor > วางทั้งหมด > Run
-- ============================================================

-- ลบฟังก์ชันเดิมก่อนเพื่อป้องกันข้อผิดพลาด 42P13 (cannot change return type)
drop function if exists get_group_report(text, bigint, int, int);
drop function if exists get_executive_itemized_report(text, int);
drop function if exists get_executive_itemized_report(text, int, int);
drop function if exists get_tax_filing_report(text, int);
drop function if exists get_tax_filing_report(text, int, int);
drop function if exists set_account_group_split(text, bigint, bigint, numeric);
drop function if exists remove_account_group_split(text, bigint, bigint);
drop function if exists get_group_members(text, bigint);
drop function if exists get_accounts(text, text);
drop function if exists get_accounts(text);
drop function if exists get_dashboard_stats(text, int, int);
drop function if exists auto_create_and_group_account(text, text, text);
drop function if exists get_executive_dashboard(text, int);
drop function if exists get_executive_monthly_report(text, int);
drop function if exists fix_corrupted_audit_logs();


-- ─────────────────────────────────────────────────────────────────
-- 1. get_group_report — ดูยอดของกลุ่ม (แม่) พร้อมยอดแยกตามรหัสบัญชี (ลูก)
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_report(
  p_actor_id text,
  p_group_id bigint,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group         record;
  v_members       jsonb   := '[]'::jsonb;
  v_group_total   numeric := 0;
  v_account_total numeric;
  v_fraction      numeric;
  a record;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานกลุ่มรหัสบัญชี');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มบัญชีนี้');
  end if;

  for a in
    select ac.id, ac.code, ac.name, coalesce(s.fraction, 1.0) as fraction
    from accounts ac
    left join account_group_splits s on s.account_id = ac.id and s.group_id = p_group_id
    where ac.group_id = p_group_id or s.group_id = p_group_id
    order by ac.code
  loop
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = p_year
      and (p_month is null or l.month = p_month);

    v_account_total := round(v_account_total * a.fraction, 2);

    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'code', a.code,
      'name', a.name,
      'fraction', a.fraction,
      'total', v_account_total
    ));
    v_group_total := v_group_total + v_account_total;
  end loop;

  return jsonb_build_object(
    'success', true,
    'groupCode', v_group.code,
    'groupName', v_group.name,
    'year', p_year,
    'month', p_month,
    'members', v_members,
    'groupTotal', v_group_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 2. get_executive_itemized_report — สรุปยอดตามกลุ่ม และรหัสบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function get_executive_itemized_report(
  p_actor_id text,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups           jsonb   := '[]'::jsonb;
  v_ungrouped        jsonb   := '[]'::jsonb;
  v_unassigned_total numeric := 0;
  v_grand_total      numeric := 0;
  v_year             int     := p_year;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total    numeric;
  v_account_total  numeric;
begin
  if not (has_page_permission(p_actor_id, 'exec-report') or has_page_permission(p_actor_id, 'exec-dashboard')) then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  for g in select id, code, name from account_groups order by code, id loop
    v_group_accounts := '[]'::jsonb;
    v_group_total    := 0;

    for a in
      select distinct ac.id, ac.code, ac.name
      from accounts ac
      left join account_group_splits s on s.account_id = ac.id
      where ac.group_id = g.id or s.group_id = g.id
      order by ac.code
    loop
      select coalesce(sum(l.amount), 0) into v_account_total
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id
        and b.batch_type = 'pl_estimate'
        and b.year       = v_year
        and (p_month is null or l.month = p_month);

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'total', v_account_total
      ));
      v_group_total := v_group_total + v_account_total;
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id,
      'code', g.code,
      'name', g.name,
      'total', v_group_total,
      'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  for a in
    select ac.id, ac.code, ac.name
    from accounts ac
    where ac.group_id is null
      and not exists (select 1 from account_group_splits s where s.account_id = ac.id)
    order by ac.code
  loop
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = v_year
      and (p_month is null or l.month = p_month);

    if v_account_total <> 0 then
      v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'total', v_account_total
      ));
      v_grand_total := v_grand_total + v_account_total;
    end if;
  end loop;

  return jsonb_build_object(
    'success',           true,
    'year',              v_year,
    'month',             p_month,
    'groups',            v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassignedTotal',   0,
    'grandTotal',        v_grand_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 3. get_tax_filing_report — รายงานภาษี / รายงานสำหรับส่งสรรพากร
-- ─────────────────────────────────────────────────────────────────
create or replace function get_tax_filing_report(
  p_actor_id text,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_lines       jsonb   := '[]'::jsonb;
  v_grand_total numeric := 0;
  v_year        int     := p_year;
  a record;
  v_total numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานสรรพากร');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  for a in select id, code, name, category from accounts order by code loop
    select coalesce(sum(l.amount), 0) into v_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = v_year
      and (p_month is null or l.month = p_month);

    if v_total <> 0 then
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'category', a.category,
        'total', v_total
      ));
      v_grand_total := v_grand_total + v_total;
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'year', v_year,
    'month', p_month,
    'lines', v_lines,
    'grandTotal', v_grand_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 4. set_account_group_split — กำหนดสัดส่วนกลุ่มรหัสบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function set_account_group_split(
  p_actor_id   text,
  p_account_id bigint,
  p_group_id   bigint,
  p_fraction   numeric
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_other_sum numeric := 0;
  v_new_sum   numeric := 0;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  if p_fraction <= 0 or p_fraction > 1.0 then
    return jsonb_build_object('success', false, 'message', 'สัดส่วนต้องมากกว่า 0% และไม่เกิน 100%');
  end if;

  select coalesce(sum(fraction), 0) into v_other_sum
  from account_group_splits
  where account_id = p_account_id and group_id <> p_group_id;

  v_new_sum := v_other_sum + p_fraction;
  if v_new_sum > 1.0001 then
    return jsonb_build_object('success', false, 'message', format('สัดส่วนรวมเกิน 100%% — รหัสนี้จัดสรรไปแล้ว %s%% เหลือใส่ได้ไม่เกิน %s%%', round(v_other_sum * 100, 1), round((1.0 - v_other_sum) * 100, 1)));
  end if;

  insert into account_group_splits (account_id, group_id, fraction)
  values (p_account_id, p_group_id, round(p_fraction, 4))
  on conflict (account_id, group_id)
  do update set fraction = round(excluded.fraction, 4);

  perform write_audit_log(p_actor_id, 'SET_ACCOUNT_GROUP_SPLIT', 'AccountGroups', format('ผูกรหัสบัญชี id %s กับกลุ่ม id %s สัดส่วน %s%%', p_account_id, p_group_id, round(p_fraction * 100, 1)));

  return jsonb_build_object('success', true, 'message', 'บันทึกสัดส่วนสำเร็จ');
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 5. remove_account_group_split — ลบสัดส่วนกลุ่มรหัสบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function remove_account_group_split(
  p_actor_id   text,
  p_account_id bigint,
  p_group_id   bigint
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  delete from account_group_splits
  where account_id = p_account_id and group_id = p_group_id;

  perform write_audit_log(p_actor_id, 'REMOVE_ACCOUNT_GROUP_SPLIT', 'AccountGroups', format('ลบผูกรหัสบัญชี id %s จากกลุ่ม id %s', p_account_id, p_group_id));

  return jsonb_build_object('success', true, 'message', 'เอารหัสออกจากกลุ่มสำเร็จ');
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 6. get_group_members — ดึงสมาชิกในกลุ่มบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_members(
  p_actor_id text,
  p_group_id bigint
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group record;
  v_members jsonb := '[]'::jsonb;
  v_available jsonb := '[]'::jsonb;
  r record;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูกลุ่มรหัสบัญชี');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มบัญชีนี้');
  end if;

  -- สมาชิกในกลุ่ม
  for r in
    select ac.id, ac.code, ac.name, ac.category, s.fraction,
      (select coalesce(sum(s2.fraction), 0) from account_group_splits s2 where s2.account_id = ac.id) as total_assigned
    from account_group_splits s
    join accounts ac on ac.id = s.account_id
    where s.group_id = p_group_id
    order by ac.code
  loop
    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'code', r.code, 'name', r.name, 'category', r.category,
      'fraction', r.fraction, 'totalAssigned', r.total_assigned
    ));
  end loop;

  -- รหัสบัญชีที่สามารถเพิ่มเข้ากลุ่มได้
  for r in
    select ac.id, ac.code, ac.name, ac.category,
      coalesce((select sum(s2.fraction) from account_group_splits s2 where s2.account_id = ac.id), 0) as total_assigned
    from accounts ac
    where not exists (select 1 from account_group_splits s3 where s3.account_id = ac.id and s3.group_id = p_group_id)
    order by ac.code
  loop
    if r.total_assigned < 0.9999 then
      v_available := v_available || jsonb_build_array(jsonb_build_object(
        'id', r.id, 'code', r.code, 'name', r.name, 'category', r.category,
        'totalAssigned', r.total_assigned,
        'remainingFraction', round(1.0 - r.total_assigned, 4)
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'group', jsonb_build_object('id', v_group.id, 'code', v_group.code, 'name', v_group.name),
    'members', v_members,
    'availableAccounts', v_available
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 7. get_accounts — ดึงรหัสบัญชีทั้งหมด พร้อมสัดส่วนกลุ่ม
-- ─────────────────────────────────────────────────────────────────
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb := '[]'::jsonb;
  r record;
  v_groups jsonb;
begin
  if not (has_page_permission(p_actor_id, 'accounts') or has_page_permission(p_actor_id, 'account-groups')) then
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
  end if;

  for r in
    select a.id, a.code, a.name, a.category, a.description
    from accounts a
    where p_query is null
       or a.code ilike '%' || p_query || '%'
       or a.name ilike '%' || p_query || '%'
       or a.category ilike '%' || p_query || '%'
    order by a.code
  loop
    select coalesce(jsonb_agg(jsonb_build_object(
      'groupId', g.id,
      'code', g.code,
      'name', g.name,
      'fraction', s.fraction
    )), '[]'::jsonb) into v_groups
    from account_group_splits s
    join account_groups g on g.id = s.group_id
    where s.account_id = r.id;

    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'id', r.id,
      'code', r.code,
      'name', r.name,
      'category', r.category,
      'description', r.description,
      'groups', v_groups
    ));
  end loop;

  return v_result;
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 8. get_dashboard_stats — แดชบอร์ดหลักระบบ GoCost
-- ─────────────────────────────────────────────────────────────────
create or replace function get_dashboard_stats(
  p_actor_id text,
  p_year     int default null,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year             int     := coalesce(p_year, extract(year from current_date)::int);
  v_total_expenses   numeric := 0;
  v_total_income     numeric := 0;
  v_doc_count        int     := 0;
  v_top_category     text    := '-';
  v_top_amount       numeric := 0;
  v_by_category      jsonb   := '[]'::jsonb;
  v_by_month         jsonb   := '[]'::jsonb;
  r record;
begin
  if not has_page_permission(p_actor_id, 'dashboard') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูแดชบอร์ด');
  end if;

  if v_year > 2400 then
    v_year := v_year - 543;
  end if;

  -- 1. รายได้รวม
  select coalesce(sum(l.amount), 0) into v_total_income
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a on a.id = l.account_id
  where b.batch_type = 'pl_estimate'
    and b.year = v_year
    and (p_month is null or l.month = p_month)
    and a.category = 'รายได้ (Revenue)';

  -- 2. รายจ่ายรวม
  select coalesce(sum(l.amount), 0) into v_total_expenses
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a on a.id = l.account_id
  where b.batch_type = 'pl_estimate'
    and b.year = v_year
    and (p_month is null or l.month = p_month)
    and a.category <> 'รายได้ (Revenue)';

  -- 3. สรุปตามหมวดหมู่
  for r in
    select a.category as cat, sum(l.amount) as amt
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a on a.id = l.account_id
    where b.batch_type = 'pl_estimate'
      and b.year = v_year
      and (p_month is null or l.month = p_month)
    group by a.category
    order by amt desc
  loop
    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', r.cat,
      'amount', r.amt
    ));
  end loop;

  -- 4. สรุปรายเดือน
  for r in
    select l.month as m, sum(l.amount) as amt
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where b.batch_type = 'pl_estimate'
      and b.year = v_year
    group by l.month
    order by l.month
  loop
    v_by_month := v_by_month || jsonb_build_array(jsonb_build_object(
      'month', r.m,
      'amount', r.amt
    ));
  end loop;

  return jsonb_build_object(
    'success',           true,
    'totalExpenses',     v_total_expenses,
    'totalIncome',       v_total_income,
    'docCount',          v_doc_count,
    'avgPerDoc',         0,
    'topCategory',       v_top_category,
    'topCategoryAmount', v_top_amount,
    'byCategory',        v_by_category,
    'byMonth',           v_by_month
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 9. auto_create_and_group_account — สร้างรหัสบัญชีและจัดกลุ่มอัตโนมัติ
-- ─────────────────────────────────────────────────────────────────
create or replace function auto_create_and_group_account(
  p_actor_id text,
  p_code     text,
  p_name     text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_code         text := trim(p_code);
  v_name         text := trim(coalesce(p_name, ''));
  v_first_digit  char(1);
  v_category     text;
  v_group_code   text;
  v_account_id   bigint;
  v_group_id     bigint;
begin
  if v_code is null or v_code = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณาระบุรหัสบัญชี');
  end if;

  v_first_digit := substring(v_code from 1 for 1);

  case v_first_digit
    when '1' then
      v_category   := 'สินทรัพย์ (Assets)';
      v_group_code := '1000-00';
    when '2' then
      v_category   := 'หนี้สิน (Liabilities)';
      v_group_code := '2000-00';
    when '3' then
      v_category   := 'ส่วนของผู้ถือหุ้น / ทุน (Equity)';
      v_group_code := '3000-00';
    when '4' then
      v_category   := 'รายได้ (Revenue)';
      v_group_code := '4000-00';
    when '5' then
      v_category   := 'ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)';
      v_group_code := '5000-00';
    when '6' then
      v_category   := 'ค่าใช้จ่ายในการขายและบริหาร (Expenses)';
      v_group_code := '6000-00';
    else
      v_category   := 'ค่าใช้จ่ายในการขายและบริหาร (Expenses)';
      v_group_code := '6000-00';
  end case;

  if v_name = '' then
    v_name := format('บัญชี %s', v_code);
  end if;

  select id into v_account_id from accounts where code = v_code;

  if v_account_id is null then
    insert into accounts (code, name, category, description)
    values (v_code, v_name, v_category, format('สร้างและจัดกลุ่มอัตโนมัติสำหรับรหัส %s', v_code))
    returning id into v_account_id;
  else
    update accounts
    set name = case when (name like 'บัญชี %' or name is null or name = '') then v_name else name end,
        category = coalesce(category, v_category)
    where id = v_account_id;
  end if;

  select id into v_group_id from account_groups where code = v_group_code limit 1;

  if v_group_id is null then
    select id into v_group_id from account_groups order by code limit 1;
  end if;

  if v_group_id is not null then
    insert into account_group_splits (account_id, group_id, fraction)
    values (v_account_id, v_group_id, 1.0)
    on conflict (account_id, group_id)
    do update set fraction = 1.0;

    update accounts set group_id = v_group_id where id = v_account_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'accountId', v_account_id,
    'code', v_code,
    'name', v_name,
    'category', v_category,
    'groupId', v_group_id,
    'groupCode', v_group_code
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 10. get_executive_dashboard — แดชบอร์ดฝ่ายบริหาร
-- ─────────────────────────────────────────────────────────────────
create or replace function get_executive_dashboard(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue  numeric := 0;
  v_total_cogs     numeric := 0;
  v_total_expenses numeric := 0;
  v_by_category    jsonb   := '[]'::jsonb;
  v_year           int     := p_year;
  v_pos_rev        numeric := 0;
  v_neg_rev        numeric := 0;
  r record;
begin
  if not (has_page_permission(p_actor_id, 'exec-dashboard') or has_page_permission(p_actor_id, 'exec-report')) then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูแดชบอร์ดฝ่ายบริหาร');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  -- 1. รายได้รวมสุทธิ (Net Revenue)
  select coalesce(sum(l.amount), 0) into v_pos_rev
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a               on a.id = l.account_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and (a.category = 'รายได้ (Revenue)' or l.code in ('4100-01', '4100-05', '4200-08', '5130-02'))
    and l.code not in ('4100-03', '4100-04');

  select coalesce(sum(abs(l.amount)), 0) into v_neg_rev
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and l.code in ('4100-03', '4100-04');

  v_total_revenue := v_pos_rev - v_neg_rev;
  if v_total_revenue = 0 then
    select coalesce(sum(l.amount), 0) into v_total_revenue
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a               on a.id = l.account_id
    where b.batch_type = 'pl_estimate' and b.year = v_year
      and a.category = 'รายได้ (Revenue)';
  end if;

  -- 2. ต้นทุนสินค้า (COGS)
  select coalesce(sum(l.amount), 0) into v_total_cogs
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a               on a.id = l.account_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and (a.category like '%ต้นทุน%' or l.code like '5130-%');

  -- 3. รวมค่าใช้จ่ายทั้งหมด (Total Expenses)
  select coalesce(sum(l.amount), 0) into v_total_expenses
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a               on a.id = l.account_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and a.category not like '%รายได้%'
    and l.code not in ('4100-01', '4100-03', '4100-04', '4100-05', '4200-08', '5130-02');

  -- 4. สรุปรายหมวดหมู่
  for r in
    select
      a.category as category,
      coalesce(sum(l.amount), 0) as actual,
      coalesce(bg.amount, 0) as budget
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a               on a.id = l.account_id
    left join budgets bg          on bg.category = a.category and bg.year = v_year
    where b.batch_type = 'pl_estimate'
      and b.year = v_year
      and a.category not like '%รายได้%'
      and l.code not in ('4100-01', '4100-03', '4100-04', '4100-05', '4200-08', '5130-02')
    group by a.category, bg.amount
  loop
    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', r.category,
      'actual', r.actual,
      'budget', r.budget,
      'remaining', r.budget - r.actual,
      'pctUsed', case when r.budget > 0 then round((r.actual / r.budget) * 100, 1) else null end,
      'attributionRate', case when v_total_revenue > 0 then round((r.actual / v_total_revenue) * 100, 2) else null end
    ));
  end loop;

  return jsonb_build_object(
    'success', true,
    'year', v_year,
    'totalRevenue', v_total_revenue,
    'totalCogs', v_total_cogs,
    'grossProfit', v_total_revenue - v_total_cogs,
    'totalExpenses', v_total_expenses,
    'netProfit', (v_total_revenue - v_total_cogs) - v_total_expenses,
    'cogsPct', case when v_total_revenue > 0 then round((v_total_cogs / v_total_revenue) * 100, 2) else null end,
    'grossProfitPct', case when v_total_revenue > 0 then round(((v_total_revenue - v_total_cogs) / v_total_revenue) * 100, 2) else null end,
    'expensePct', case when v_total_revenue > 0 then round((v_total_expenses / v_total_revenue) * 100, 2) else null end,
    'netProfitPct', case when v_total_revenue > 0 then round((((v_total_revenue - v_total_cogs) - v_total_expenses) / v_total_revenue) * 100, 2) else null end,
    'byCategory', v_by_category
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 11. get_executive_monthly_report — รายงานผู้บริหาร P&L รายเดือน
-- ─────────────────────────────────────────────────────────────────
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
  v_year int := p_year;
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
  v_pos_rev numeric;
  v_neg_rev numeric;
begin
  if not (has_page_permission(p_actor_id, 'exec-report') or has_page_permission(p_actor_id, 'pl-report')) then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  -- 1. คำนวณรายได้สุทธิรวมในแต่ละเดือน (ม.ค.-ธ.ค.)
  for m in 1..12 loop
    select coalesce(sum(l.amount), 0) into v_pos_rev
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a2 on a2.id = l.account_id
    where b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m
      and (a2.category = 'รายได้ (Revenue)' or l.code in ('4100-01', '4100-05', '4200-08', '5130-02'))
      and l.code not in ('4100-03', '4100-04');

    select coalesce(sum(abs(l.amount)), 0) into v_neg_rev
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m
      and l.code in ('4100-03', '4100-04');

    v_amt := v_pos_rev - v_neg_rev;
    if v_amt = 0 then
      select coalesce(sum(l.amount), 0) into v_amt
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      join accounts a2 on a2.id = l.account_id
      where b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m
        and a2.category = 'รายได้ (Revenue)';
    end if;

    v_revenue_monthly[m] := v_amt;
    v_revenue_total := v_revenue_total + v_amt;
  end loop;

  -- 2. วนคำนวณแต่ละกลุ่มรหัสบัญชี
  for g in select id, code, name from account_groups order by code, id loop
    v_group_accounts := '[]'::jsonb;
    v_group_monthly := array_fill(0::numeric, array[12]);
    v_group_total := 0;

    for a in
      select distinct ac.id, ac.code, ac.name
      from accounts ac
      left join account_group_splits s on s.account_id = ac.id
      where ac.group_id = g.id or s.group_id = g.id
      order by ac.code
    loop
      v_acct_monthly := array_fill(0::numeric, array[12]);
      v_acct_total := 0;
      for m in 1..12 loop
        select coalesce(sum(l.amount), 0) into v_amt
        from account_import_lines l
        join account_import_batches b on b.id = l.batch_id
        where l.account_id = a.id and b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m;
        v_acct_monthly[m] := v_amt;
        v_acct_total := v_acct_total + v_amt;
        v_group_monthly[m] := v_group_monthly[m] + v_amt;
      end loop;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'monthly', to_jsonb(v_acct_monthly),
        'total', v_acct_total
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
      'groupId', g.id,
      'code', g.code,
      'name', g.name,
      'accounts', v_group_accounts,
      'monthly', to_jsonb(v_group_monthly),
      'total', v_group_total,
      'pctOfRevenueMonthly', v_pct_monthly,
      'pctOfRevenueTotal', case when v_revenue_total > 0 then round((v_group_total / v_revenue_total) * 100, 2) else null end
    ));
  end loop;

  -- 4. ดึงข้อมูลรายบัญชีทั้งหมด (rawAccounts)
  declare
    v_raw_accounts jsonb := '[]'::jsonb;
    r_acc record;
  begin
    for r_acc in
      select distinct l.code, coalesce(a2.name, l.description, l.code) as name
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      left join accounts a2 on a2.id = l.account_id
      where b.batch_type = 'pl_estimate' and b.year = v_year
      order by l.code
    loop
      v_acct_monthly := array_fill(0::numeric, array[12]);
      v_acct_total := 0;
      for m in 1..12 loop
        select coalesce(sum(l.amount), 0) into v_amt
        from account_import_lines l
        join account_import_batches b on b.id = l.batch_id
        where b.batch_type = 'pl_estimate' and b.year = v_year and l.code = r_acc.code and l.month = m;
        v_acct_monthly[m] := v_amt;
        v_acct_total := v_acct_total + v_amt;
      end loop;

      v_raw_accounts := v_raw_accounts || jsonb_build_array(jsonb_build_object(
        'code', r_acc.code,
        'name', r_acc.name,
        'monthly', to_jsonb(v_acct_monthly),
        'total', v_acct_total
      ));
    end loop;

    return jsonb_build_object(
      'success', true,
      'year', v_year,
      'revenueMonthly', to_jsonb(v_revenue_monthly),
      'revenueTotal', v_revenue_total,
      'groups', v_groups,
      'ungroupedAccounts', v_ungrouped,
      'rawAccounts', v_raw_accounts
    );
  end;
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 12. fix_corrupted_audit_logs — ซ่อมแซมตัวอักษรภาษาไทยที่เพี้ยนใน audit_logs
-- ─────────────────────────────────────────────────────────────────
create or replace function fix_corrupted_audit_logs()
returns jsonb
language plpgsql
security definer
as $$
declare
  r record;
  v_fixed text;
  v_count int := 0;
begin
  for r in select log_id, details from audit_logs where details like '%เธ%' or details like '%เน%' loop
    begin
      v_fixed := convert_from(convert_to(r.details, 'WIN874'), 'UTF8');
      update audit_logs set details = v_fixed where log_id = r.log_id;
      v_count := v_count + 1;
    exception when others then
      null;
    end;
  end loop;
  return jsonb_build_object('success', true, 'message', format('ซ่อมแซมตัวอักษรภาษาไทยในบันทึกกิจกรรมเรียบร้อย %s รายการ', v_count));
end;
$$;
