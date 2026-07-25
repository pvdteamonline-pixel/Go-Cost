-- ============================================================
-- GoCost — Phase 5l: รองรับรหัสบัญชี 1 ตัวแบ่งสัดส่วนอยู่หลายกลุ่มได้
-- รันหลัง phase5k_reconciliation.sql
--
-- เปลี่ยนจาก accounts.group_id (1 รหัส = 1 กลุ่มเท่านั้น) เป็นตาราง
-- account_group_splits (1 รหัส = หลายกลุ่ม พร้อมสัดส่วน % ของแต่ละกลุ่ม)
-- ตัวอย่างจริงจากไฟล์ P&L: รหัส 6120-14 แบ่ง 1/3 ให้กลุ่มขาย, 2/3 ให้กลุ่มบริหาร
--
-- กติกาความถูกต้อง (ยอดสำคัญมาก ห้ามผิดพลาด):
-- - สัดส่วนรวมของ 1 รหัสบัญชี ต้องไม่เกิน 100% (ระบบเช็คให้ทุกครั้งที่แก้ไข)
-- - ถ้ารหัสบัญชีมีสัดส่วนไม่ครบ 100% ส่วนที่เหลือจะถูกแยกโชว์เป็น "ยังไม่ได้จัดสรร
--   บางส่วน" ในรายงาน ไม่ปัดตกหายไปเงียบๆ เพื่อให้ยอดรวมทั้งหมดตรงกับความเป็นจริงเสมอ
-- ============================================================

create table if not exists account_group_splits (
  id         bigint generated always as identity primary key,
  account_id bigint not null references accounts(id) on delete cascade,
  group_id   bigint not null references account_groups(id) on delete cascade,
  fraction   numeric not null check (fraction > 0 and fraction <= 1),
  unique (account_id, group_id)
);

alter table account_group_splits enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ย้ายข้อมูลเดิมจาก accounts.group_id (1:1) มาเป็น split แบบ 100% ให้อัตโนมัติ
insert into account_group_splits (account_id, group_id, fraction)
select id, group_id, 1.0 from accounts where group_id is not null
on conflict (account_id, group_id) do nothing;

-- ─────────────────────────────────────────────
-- set_account_group_split — เพิ่ม/แก้ไขสัดส่วนของรหัสบัญชีหนึ่งตัวในกลุ่มหนึ่ง
-- ─────────────────────────────────────────────
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
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;
  if p_fraction is null or p_fraction <= 0 or p_fraction > 1 then
    return jsonb_build_object('success', false, 'message', 'สัดส่วนต้องมากกว่า 0% และไม่เกิน 100%');
  end if;

  select coalesce(sum(fraction), 0) into v_existing_total
  from account_group_splits
  where account_id = p_account_id and group_id <> p_group_id;

  if v_existing_total + p_fraction > 1.0001 then
    return jsonb_build_object('success', false, 'message',
      format('สัดส่วนรวมเกิน 100%% — รหัสนี้ถูกจัดสรรไปแล้ว %s%% ในกลุ่มอื่น เหลือให้ใส่ได้ไม่เกิน %s%%',
        round(v_existing_total * 100, 1), round((1 - v_existing_total) * 100, 1)));
  end if;

  insert into account_group_splits (account_id, group_id, fraction)
  values (p_account_id, p_group_id, p_fraction)
  on conflict (account_id, group_id) do update set fraction = excluded.fraction;

  perform write_audit_log(p_actor_id, 'SET_ACCOUNT_GROUP_SPLIT', 'AccountGroups',
    format('รหัสบัญชี id %s → กลุ่ม id %s สัดส่วน %s%%', p_account_id, p_group_id, round(p_fraction * 100, 1)));

  return jsonb_build_object('success', true, 'message', 'บันทึกสัดส่วนสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- remove_account_group_split — เอารหัสบัญชีออกจากกลุ่มหนึ่ง (ลบ split เฉพาะคู่นี้)
-- ─────────────────────────────────────────────
create or replace function remove_account_group_split(p_actor_id text, p_account_id bigint, p_group_id bigint)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  delete from account_group_splits where account_id = p_account_id and group_id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลนี้');
  end if;

  perform write_audit_log(p_actor_id, 'REMOVE_ACCOUNT_GROUP_SPLIT', 'AccountGroups',
    format('เอารหัสบัญชี id %s ออกจากกลุ่ม id %s', p_account_id, p_group_id));

  return jsonb_build_object('success', true, 'message', 'เอาออกจากกลุ่มสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_group_members — เปลี่ยนเป็นแสดงสัดส่วน (fraction) ของแต่ละสมาชิก + โชว์
-- % ที่ถูกจัดสรรไปแล้วในกลุ่มอื่นของรหัสที่ยังไม่ได้อยู่ในกลุ่มนี้
-- ─────────────────────────────────────────────
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
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูกลุ่มรหัสบัญชี');
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

-- ─────────────────────────────────────────────
-- get_accounts — เปลี่ยนคอลัมน์ group_id/group_name เดี่ยว เป็น groups[] (array
-- ของกลุ่มที่รหัสนี้ถูกจัดสรรอยู่ พร้อมสัดส่วน)
-- ─────────────────────────────────────────────
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
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
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

-- ─────────────────────────────────────────────
-- get_group_report — คูณยอดจริงของแต่ละรหัสด้วยสัดส่วน (fraction) ก่อนรวมเป็นยอดกลุ่ม
-- ─────────────────────────────────────────────
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
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานกลุ่มนี้');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
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

-- ─────────────────────────────────────────────
-- get_executive_itemized_report — fraction-weighting + แยกโชว์ "ยังไม่ได้จัดสรร
-- บางส่วน" ของรหัสที่สัดส่วนรวมไม่ถึง 100% เพื่อให้ grandTotal ตรงกับยอดใช้จ่ายจริง
-- ทั้งหมดเสมอ
-- ─────────────────────────────────────────────
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
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
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
  where e.account_id is null and e.main_category <> 'รายได้'
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
