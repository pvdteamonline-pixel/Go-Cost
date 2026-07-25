-- ============================================================
-- GoCost — Phase 5a: จัดการรหัสทางบัญชี (ผังบัญชี) — รากฐานของเฟส 5
-- รันหลัง phase4j_migrate_legacy_status.sql
--
-- ครอบคลุม:
-- 1. ตาราง accounts + CRUD เต็มรูปแบบ (เพิ่ม/แก้ไข/ลบ) ผ่านหน้า "จัดการรหัสบัญชี"
-- 2. กลไก "ตรวจจับรหัสใหม่จากไฟล์ที่แนบ" แบบทั่วไป (generic) — ใช้ได้กับไฟล์
--    รูปแบบไหนก็ได้ที่ parse ออกมาเป็น {code, name, category, description} แล้ว
--    ยังไม่ได้ผูกกับ parser เฉพาะของ Express/Bluenote เพราะยังไม่มีไฟล์ตัวอย่าง
--    จริงให้ดู (รอไฟล์อยู่) — เมื่อได้ไฟล์แล้วจะมาต่อ parser เฉพาะให้เรียกกลไกนี้
-- 3. ถ้ารหัสใหม่ข้อมูลไม่ครบ (รหัส/ชื่อ/หมวดหมู่/รายละเอียด) ต้องกรอกให้ครบก่อนบันทึก
-- ============================================================

create table if not exists accounts (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  name        text not null,
  category    text not null,   -- เช่น 'รายได้ (Revenue)', 'ค่าใช้จ่าย (Expenses)', 'อื่นๆ (Others)'
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_accounts_code on accounts(code);

alter table accounts enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- get_accounts — ต้องมีสิทธิ์ page key 'accounts'
-- ─────────────────────────────────────────────
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns table (
  id bigint, code text, name text, category text, description text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
  end if;

  return query
  select a.id, a.code, a.name, a.category, a.description, a.created_at, a.updated_at
  from accounts a
  where p_query is null or trim(p_query) = ''
     or a.code ilike '%' || p_query || '%'
     or a.name ilike '%' || p_query || '%'
     or a.category ilike '%' || p_query || '%'
  order by a.code;
end;
$$;

-- ─────────────────────────────────────────────
-- create_account / update_account / delete_account
-- ─────────────────────────────────────────────
create or replace function create_account(
  p_code text, p_name text, p_category text, p_description text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id bigint;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์เพิ่มรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสบัญชี');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อบัญชี');
  end if;
  if coalesce(trim(p_category), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกหมวดหมู่บัญชี');
  end if;
  if coalesce(trim(p_description), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรายละเอียด');
  end if;

  if exists (select 1 from accounts where code = trim(p_code)) then
    return jsonb_build_object('success', false, 'message', format('รหัสบัญชี %s มีอยู่แล้วในระบบ', p_code));
  end if;

  insert into accounts (code, name, category, description)
  values (trim(p_code), trim(p_name), trim(p_category), trim(p_description))
  returning id into v_id;

  perform write_audit_log(p_actor_id, 'CREATE_ACCOUNT', 'Accounts', format('เพิ่มรหัสบัญชี: %s (%s)', p_code, p_name));
  return jsonb_build_object('success', true, 'message', 'เพิ่มรหัสบัญชีสำเร็จ', 'id', v_id);
end;
$$;

create or replace function update_account(
  p_id bigint, p_code text, p_name text, p_category text, p_description text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสบัญชี');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อบัญชี');
  end if;
  if coalesce(trim(p_category), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกหมวดหมู่บัญชี');
  end if;
  if coalesce(trim(p_description), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรายละเอียด');
  end if;

  if exists (select 1 from accounts where code = trim(p_code) and id <> p_id) then
    return jsonb_build_object('success', false, 'message', format('รหัสบัญชี %s ถูกใช้กับรายการอื่นอยู่แล้ว', p_code));
  end if;

  update accounts set
    code = trim(p_code), name = trim(p_name), category = trim(p_category),
    description = trim(p_description), updated_at = now()
  where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสบัญชีนี้');
  end if;

  perform write_audit_log(p_actor_id, 'UPDATE_ACCOUNT', 'Accounts', format('แก้ไขรหัสบัญชี id %s: %s', p_id, p_code));
  return jsonb_build_object('success', true, 'message', 'แก้ไขรหัสบัญชีสำเร็จ');
end;
$$;

create or replace function delete_account(p_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบรหัสบัญชี');
  end if;

  delete from accounts where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสบัญชีนี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_ACCOUNT', 'Accounts', 'ลบรหัสบัญชี id: ' || p_id);
  return jsonb_build_object('success', true, 'message', 'ลบรหัสบัญชีสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- check_new_account_codes — ตรวจว่ารหัสจากไฟล์ที่แนบ (parse มาแล้วฝั่ง client เป็น
-- jsonb array ของ {code,name,category,description}) มีตัวไหนใหม่บ้าง (ยังไม่มีใน
-- accounts) คืนกลับมาเป็น 2 กลุ่ม: รหัสใหม่ที่ข้อมูลครบ / รหัสใหม่ที่ข้อมูลไม่ครบ
-- (ให้ frontend เตือนให้กรอกให้ครบก่อนกดบันทึกจริงตามที่ขอ)
-- ─────────────────────────────────────────────
create or replace function check_new_account_codes(p_actor_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_code text;
  v_complete jsonb := '[]'::jsonb;
  v_incomplete jsonb := '[]'::jsonb;
  v_existing_count int := 0;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้ารหัสบัญชี');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null then continue; end if;

    if exists (select 1 from accounts where code = v_code) then
      v_existing_count := v_existing_count + 1;
      continue;
    end if;

    if coalesce(trim(v_row->>'name'), '') = '' or coalesce(trim(v_row->>'category'), '') = ''
       or coalesce(trim(v_row->>'description'), '') = '' then
      v_incomplete := v_incomplete || jsonb_build_array(v_row);
    else
      v_complete := v_complete || jsonb_build_array(v_row);
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'existingCount', v_existing_count,
    'newComplete', v_complete,
    'newIncomplete', v_incomplete
  );
end;
$$;

-- ─────────────────────────────────────────────
-- bulk_import_accounts — บันทึกรหัสใหม่ที่ข้อมูลครบแล้ว (เรียกหลังจาก
-- check_new_account_codes + frontend ให้ผู้ใช้กรอกช่องที่ขาดจนครบแล้วเท่านั้น)
-- ปฏิเสธทั้งชุดถ้ามีแถวไหนข้อมูลยังไม่ครบ ป้องกันข้อมูลครึ่งๆ กลางๆ เข้าระบบ
-- ─────────────────────────────────────────────
create or replace function bulk_import_accounts(p_actor_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_count int := 0;
  v_skipped int := 0;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้ารหัสบัญชี');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if coalesce(trim(v_row->>'code'), '') = '' or coalesce(trim(v_row->>'name'), '') = ''
       or coalesce(trim(v_row->>'category'), '') = '' or coalesce(trim(v_row->>'description'), '') = '' then
      return jsonb_build_object('success', false, 'message',
        format('รหัส %s ข้อมูลยังไม่ครบ กรุณากรอกให้ครบก่อนบันทึก', coalesce(v_row->>'code', '(ไม่ทราบรหัส)')));
    end if;

    if exists (select 1 from accounts where code = trim(v_row->>'code')) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into accounts (code, name, category, description)
    values (trim(v_row->>'code'), trim(v_row->>'name'), trim(v_row->>'category'), trim(v_row->>'description'));
    v_count := v_count + 1;
  end loop;

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNTS', 'Accounts', format('นำเข้ารหัสบัญชีใหม่ %s รายการ (ข้าม %s รายการที่มีอยู่แล้ว)', v_count, v_skipped));
  return jsonb_build_object('success', true, 'message', format('นำเข้ารหัสบัญชีใหม่สำเร็จ %s รายการ', v_count), 'imported', v_count, 'skipped', v_skipped);
end;
$$;

-- ─────────────────────────────────────────────
-- default permission: 'accounts' ให้เฉพาะ ADMIN โดย default (role อื่นต้องให้
-- ADMIN มอบสิทธิ์เองถ้าต้องการ) — เปลี่ยนแค่ case ของ ADMIN ใน v_default_perms
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
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores","accounts"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
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

-- backfill: ให้บัญชี ADMIN ทุกบัญชีมีสิทธิ์ 'accounts' ด้วย
update users set page_permissions = page_permissions || '["accounts"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'accounts');
