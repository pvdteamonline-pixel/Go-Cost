-- ============================================================
-- GoCost — Phase 5e: กลุ่มรหัสบัญชี (แม่/ลูก)
-- รันหลัง phase5d_executive_dashboard.sql
--
-- "แม่กลุ่ม" (account_groups) = สร้างเองโดย admin ตั้งชื่อ+รหัสเอง
-- "ลูกกลุ่ม" = รหัสบัญชีที่มีอยู่แล้วในตาราง accounts ถูก assign เข้ากลุ่มใดกลุ่มหนึ่ง
-- (1 รหัสอยู่ได้แค่ 1 กลุ่มเท่านั้น — ถ้าเปลี่ยนกลุ่มคือย้าย ไม่ใช่อยู่หลายกลุ่มพร้อมกัน)
-- ============================================================

create table if not exists account_groups (
  id         bigint generated always as identity primary key,
  code       text not null unique,
  name       text not null,
  created_by text references users(id),
  created_at timestamptz not null default now()
);

alter table accounts add column if not exists group_id bigint references account_groups(id);

alter table account_groups enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น
-- (ใช้สิทธิ์ page key 'accounts' เดียวกับหน้าจัดการรหัสบัญชี ไม่แยกสิทธิ์ใหม่)

-- ─────────────────────────────────────────────
-- get_account_groups — คืนรายชื่อกลุ่มทั้งหมด พร้อมจำนวนรหัสลูกในแต่ละกลุ่ม
-- ─────────────────────────────────────────────
create or replace function get_account_groups(p_actor_id text)
returns table (id bigint, code text, name text, child_count bigint, created_at timestamptz)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    raise exception 'คุณไม่มีสิทธิ์ดูกลุ่มรหัสบัญชี';
  end if;

  return query
  select g.id, g.code, g.name, count(a.id), g.created_at
  from account_groups g
  left join accounts a on a.group_id = g.id
  group by g.id
  order by g.name;
end;
$$;

-- ─────────────────────────────────────────────
-- get_group_members — รายชื่อรหัสบัญชีที่อยู่ในกลุ่มนี้ + รายชื่อที่ยังไม่มีกลุ่ม
-- (สำหรับหน้าจัดการกลุ่ม ใช้เลือกว่าจะเพิ่มตัวไหนเข้ากลุ่ม)
-- ─────────────────────────────────────────────
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

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'name', name) order by code), '[]'::jsonb)
  into v_members
  from accounts where group_id = p_group_id;

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'name', name) order by code), '[]'::jsonb)
  into v_available
  from accounts where group_id is distinct from p_group_id;

  return jsonb_build_object('success', true, 'members', v_members, 'available', v_available);
end;
$$;

-- ─────────────────────────────────────────────
-- create_account_group / update_account_group / delete_account_group
-- ─────────────────────────────────────────────
create or replace function create_account_group(p_code text, p_name text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id bigint;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์สร้างกลุ่มรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสกลุ่ม');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อกลุ่ม');
  end if;
  if exists (select 1 from account_groups where code = trim(p_code)) then
    return jsonb_build_object('success', false, 'message', format('รหัสกลุ่ม %s มีอยู่แล้ว', p_code));
  end if;

  insert into account_groups (code, name, created_by) values (trim(p_code), trim(p_name), p_actor_id)
  returning id into v_id;

  perform write_audit_log(p_actor_id, 'CREATE_ACCOUNT_GROUP', 'AccountGroups', format('สร้างกลุ่ม: %s (%s)', p_code, p_name));
  return jsonb_build_object('success', true, 'message', 'สร้างกลุ่มสำเร็จ', 'id', v_id);
end;
$$;

create or replace function update_account_group(p_id bigint, p_code text, p_name text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขกลุ่มรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' or coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสและชื่อกลุ่มให้ครบ');
  end if;
  if exists (select 1 from account_groups where code = trim(p_code) and id <> p_id) then
    return jsonb_build_object('success', false, 'message', format('รหัสกลุ่ม %s ถูกใช้อยู่แล้ว', p_code));
  end if;

  update account_groups set code = trim(p_code), name = trim(p_name) where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  perform write_audit_log(p_actor_id, 'UPDATE_ACCOUNT_GROUP', 'AccountGroups', format('แก้ไขกลุ่ม id %s: %s', p_id, p_code));
  return jsonb_build_object('success', true, 'message', 'แก้ไขกลุ่มสำเร็จ');
end;
$$;

create or replace function delete_account_group(p_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_child_count int;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบกลุ่มรหัสบัญชี');
  end if;

  select count(*) into v_child_count from accounts where group_id = p_id;
  if v_child_count > 0 then
    return jsonb_build_object('success', false, 'message',
      format('ลบไม่ได้ — ยังมีรหัสบัญชีอยู่ในกลุ่มนี้ %s รายการ กรุณาย้ายออกก่อน', v_child_count));
  end if;

  delete from account_groups where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_ACCOUNT_GROUP', 'AccountGroups', 'ลบกลุ่ม id: ' || p_id);
  return jsonb_build_object('success', true, 'message', 'ลบกลุ่มสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- assign_account_to_group — เพิ่ม/ย้าย/เอารหัสบัญชีออกจากกลุ่ม (p_group_id = null คือเอาออก)
-- ─────────────────────────────────────────────
create or replace function assign_account_to_group(p_account_id bigint, p_group_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  update accounts set group_id = p_group_id where id = p_account_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสบัญชีนี้');
  end if;

  perform write_audit_log(p_actor_id, 'ASSIGN_ACCOUNT_GROUP', 'AccountGroups',
    format('รหัสบัญชี id %s → กลุ่ม id %s', p_account_id, coalesce(p_group_id::text, '(เอาออกจากกลุ่ม)')));
  return jsonb_build_object('success', true, 'message', 'อัปเดตกลุ่มสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_accounts — เพิ่ม group_id/group_name ในผลลัพธ์ (ต้อง drop ก่อนเพราะเปลี่ยน
-- return signature จากเฟส 5a เดิม)
-- ─────────────────────────────────────────────
drop function if exists get_accounts(text, text);
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns table (
  id bigint, code text, name text, category text, description text,
  group_id bigint, group_name text, created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
  end if;

  return query
  select a.id, a.code, a.name, a.category, a.description, a.group_id, g.name, a.created_at, a.updated_at
  from accounts a
  left join account_groups g on g.id = a.group_id
  where p_query is null or trim(p_query) = ''
     or a.code ilike '%' || p_query || '%'
     or a.name ilike '%' || p_query || '%'
     or a.category ilike '%' || p_query || '%'
  order by a.code;
end;
$$;
