-- ============================================================
-- GoCost — Phase 4e: แทนที่ข้อมูลร้านค้าด้วยไฟล์ใหม่ + เพิ่ม CRUD เต็มรูปแบบ
-- รันหลัง phase4d_defaults_and_migration.sql
--
-- ⚠️ คำเตือนสำคัญ: ส่วน TRUNCATE ด้านล่างจะลบร้านค้าเดิมทั้งหมดและ CASCADE ไปลบ
-- workshop_plans ที่อ้างอิงร้านเหล่านั้นด้วย (เพราะมี foreign key) ถ้ามีคำขอ Workshop
-- ที่สร้างไว้แล้วจากข้อมูลร้านชุดเดิม จะหายไปด้วย — ถ้าไม่ต้องการแบบนี้ ให้หยุดก่อน
-- รันส่วนนี้แล้วแจ้งกลับมา จะทำสคริปต์ sync แบบไม่ลบข้อมูลเดิมให้แทน
-- ============================================================

-- เพิ่มคอลัมน์ label ข้อความอิสระสำหรับชื่อเซลล์ (แยกจาก assigned_sales_id ที่เป็น FK จริง)
alter table stores add column if not exists assigned_sales_name text;

-- ล้างข้อมูลร้านค้าเดิมทั้งหมด (ตามที่ขอ "เอามาจากไฟล์นี้แทน")
truncate table stores cascade;

-- ============================================================
-- CRUD RPCs สำหรับหน้า "จัดการร้านค้า" (ต้องมีสิทธิ์ page key 'stores')
-- ============================================================

create or replace function get_stores(p_actor_id text, p_query text default null)
returns table (
  id bigint, customer_code text, name text, region text, province text,
  assigned_sales_name text, assigned_sales_id text, created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'stores') then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูลร้านค้า';
  end if;

  return query
  select s.id, s.customer_code, s.name, s.region, s.province,
         s.assigned_sales_name, s.assigned_sales_id, s.created_at
  from stores s
  where p_query is null or trim(p_query) = ''
     or s.name ilike '%' || p_query || '%'
     or s.customer_code ilike '%' || p_query || '%'
     or s.province ilike '%' || p_query || '%'
  order by s.name;
end;
$$;

create or replace function create_store(
  p_customer_code text, p_name text, p_region text, p_province text,
  p_assigned_sales_name text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id bigint;
begin
  if not has_page_permission(p_actor_id, 'stores') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์เพิ่มร้านค้า');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า');
  end if;

  insert into stores (customer_code, name, region, province, assigned_sales_name)
  values (nullif(trim(p_customer_code), ''), trim(p_name), nullif(trim(p_region), ''),
          nullif(trim(p_province), ''), nullif(trim(p_assigned_sales_name), ''))
  returning id into v_id;

  perform write_audit_log(p_actor_id, 'CREATE_STORE', 'Stores', format('เพิ่มร้าน: %s (id %s)', p_name, v_id));
  return jsonb_build_object('success', true, 'message', 'เพิ่มร้านค้าสำเร็จ', 'id', v_id);
end;
$$;

create or replace function update_store(
  p_id bigint, p_customer_code text, p_name text, p_region text, p_province text,
  p_assigned_sales_name text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'stores') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขร้านค้า');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า');
  end if;

  update stores set
    customer_code = nullif(trim(p_customer_code), ''),
    name = trim(p_name),
    region = nullif(trim(p_region), ''),
    province = nullif(trim(p_province), ''),
    assigned_sales_name = nullif(trim(p_assigned_sales_name), '')
  where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  perform write_audit_log(p_actor_id, 'UPDATE_STORE', 'Stores', format('แก้ไขร้าน id %s: %s', p_id, p_name));
  return jsonb_build_object('success', true, 'message', 'แก้ไขร้านค้าสำเร็จ');
end;
$$;

create or replace function delete_store(p_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_in_use int;
begin
  if not has_page_permission(p_actor_id, 'stores') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบร้านค้า');
  end if;

  select count(*) into v_in_use from workshop_plans where store_id = p_id;
  if v_in_use > 0 then
    return jsonb_build_object('success', false, 'message',
      format('ลบไม่ได้ — มีคำขอ Workshop ผูกอยู่กับร้านนี้ %s รายการ', v_in_use));
  end if;

  delete from stores where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_STORE', 'Stores', 'ลบร้าน id: ' || p_id);
  return jsonb_build_object('success', true, 'message', 'ลบร้านค้าสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- search_stores — อัปเดตให้ส่ง assigned_sales_name (label ข้อความ) มาด้วย
-- ใช้ coalesce กับชื่อจาก assigned_sales_id (ถ้ามีการผูกบัญชีจริงในอนาคต ให้ใช้อันนั้นก่อน)
-- ─────────────────────────────────────────────
create or replace function search_stores(p_query text)
returns table (
  id bigint, customer_code text, name text, region text, province text,
  assigned_sales_id text, assigned_sales_name text
)
language sql
security definer
as $$
  select s.id, s.customer_code, s.name, s.region, s.province,
         s.assigned_sales_id, coalesce(u.name, s.assigned_sales_name) as assigned_sales_name
  from stores s
  left join users u on u.id = s.assigned_sales_id
  where p_query is null or trim(p_query) = ''
     or s.name ilike '%' || p_query || '%'
     or s.customer_code ilike '%' || p_query || '%'
     or s.province ilike '%' || p_query || '%'
     or s.region ilike '%' || p_query || '%'
  order by s.name
  limit 20;
$$;

-- ─────────────────────────────────────────────
-- default permission ใหม่: เพิ่ม 'stores' ให้ ADMIN โดย default (คนอื่นต้องให้ ADMIN
-- มอบสิทธิ์เองทีละคนถ้าต้องการ) — เปลี่ยนแค่ v_default_perms case ของ ADMIN เท่านั้น
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
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan","workshop-approve","workshop-accounting","stores"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","workshop-accounting"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- backfill: เติมสิทธิ์ 'stores' ให้บัญชี ADMIN ที่มีอยู่แล้ว
update users set page_permissions = page_permissions || '["stores"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'stores');
