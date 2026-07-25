-- ============================================================
-- GoCost — Phase 5j: แนบไฟล์งบทดลอง + ไฟล์รายจ่ายจริง (2 ประเภทแยกกัน)
-- รันหลัง phase5i_report_refinements.sql
--
-- หลักการความปลอดภัยของข้อมูล (เพราะยอดนี้สำคัญมาก ห้ามผิดพลาด):
-- นำเข้าแบบ "ทั้งหมดหรือไม่มีเลย" (all-or-nothing) — ถ้าไฟล์มีรหัสบัญชีที่ยังไม่มี
-- ในระบบแม้แต่ 1 รหัส จะปฏิเสธการนำเข้าทั้งไฟล์ทันที ไม่นำเข้าบางส่วน เพื่อกัน
-- ข้อมูลครึ่งๆ กลางๆ เข้าระบบ — ต้องไปเพิ่มรหัสที่ขาดในหน้า "จัดการรหัสบัญชี" ก่อน
-- แล้วค่อยอัปโหลดไฟล์ซ้ำ
--
-- ⚠️ หมายเหตุสำคัญ: ยอดที่นำเข้าจากไฟล์เหล่านี้ ตอนนี้เก็บไว้เป็น "ข้อมูลอ้างอิง
-- แยกต่างหาก" (account_import_lines) ยังไม่ถูกผสมรวมเข้ากับยอดใน 2 หน้ารายงานหลัก
-- (รายงานผู้บริหาร / รายงานกรมสรรพากร ที่ดึงจาก expense_records ที่พนักงานกรอกเอง)
-- เพราะยังไม่ได้ตกลงกันว่าจะ "รวม" หรือ "ใช้เทียบ" กันยังไงให้ไม่ซ้ำซ้อน/ไม่ผิดพลาด
-- — ให้แจ้งมาว่าต้องการให้ 2 แหล่งข้อมูลนี้สัมพันธ์กันแบบไหน จะต่อให้ครบในเฟสถัดไป
-- ============================================================

create table if not exists account_import_batches (
  id          bigint generated always as identity primary key,
  batch_type  text not null check (batch_type in ('trial_balance', 'expense_file')),
  year        int not null,
  month       int,              -- null ได้สำหรับงบทดลองที่เป็นยอดสะสมทั้งปี
  file_name   text,
  uploaded_by text references users(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists account_import_lines (
  id          bigint generated always as identity primary key,
  batch_id    bigint not null references account_import_batches(id) on delete cascade,
  account_id  bigint not null references accounts(id),
  code        text not null,     -- เก็บรหัสดิบจากไฟล์ไว้ด้วย เผื่อเทียบย้อนหลัง
  amount      numeric not null,
  description text
);

create index if not exists idx_import_lines_batch on account_import_lines(batch_id);
create index if not exists idx_import_lines_account on account_import_lines(account_id);

alter table account_import_batches enable row level security;
alter table account_import_lines enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- check_import_rows — เช็คว่ารหัสในไฟล์ที่แนบตรงกับผังบัญชีครบไหม ก่อนจะให้ยืนยัน
-- นำเข้าจริง (ไม่ insert อะไรในขั้นนี้ แค่ตรวจสอบ)
-- ─────────────────────────────────────────────
create or replace function check_import_rows(p_actor_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_code text;
  v_matched jsonb := '[]'::jsonb;
  v_unmatched jsonb := '[]'::jsonb;
  v_account_id bigint;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้าไฟล์บัญชี');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null then continue; end if;

    select id into v_account_id from accounts where code = v_code;
    if v_account_id is null then
      v_unmatched := v_unmatched || jsonb_build_array(v_row);
    else
      v_matched := v_matched || jsonb_build_array(v_row || jsonb_build_object('accountId', v_account_id));
    end if;
  end loop;

  return jsonb_build_object('success', true, 'matched', v_matched, 'unmatched', v_unmatched);
end;
$$;

-- ─────────────────────────────────────────────
-- import_account_file — นำเข้าจริงแบบ all-or-nothing (ต้องเช็ค check_import_rows
-- ผ่านหมดก่อนแล้วเท่านั้นถึงจะเรียกตัวนี้ได้ — ถ้ายังมี unmatched อยู่จะปฏิเสธ)
-- ─────────────────────────────────────────────
create or replace function import_account_file(
  p_actor_id text, p_batch_type text, p_year int, p_month int, p_file_name text, p_rows jsonb
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
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้าไฟล์บัญชี');
  end if;
  if p_batch_type not in ('trial_balance', 'expense_file') then
    return jsonb_build_object('success', false, 'message', 'ประเภทไฟล์ไม่ถูกต้อง');
  end if;
  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return jsonb_build_object('success', false, 'message', 'ไม่มีข้อมูลให้นำเข้า');
  end if;

  -- ตรวจซ้ำอีกครั้งฝั่ง server ว่าทุกรหัสมีอยู่จริง (ห้ามเชื่อฝั่ง client อย่างเดียว)
  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null or not exists (select 1 from accounts where code = v_code) then
      return jsonb_build_object('success', false, 'message',
        format('รหัสบัญชี %s ไม่มีในระบบ กรุณาเพิ่มในหน้า "จัดการรหัสบัญชี" ก่อน แล้วนำเข้าใหม่', coalesce(v_code, '(ว่าง)')));
    end if;
  end loop;

  insert into account_import_batches (batch_type, year, month, file_name, uploaded_by)
  values (p_batch_type, p_year, p_month, p_file_name, p_actor_id)
  returning id into v_batch_id;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := trim(v_row->>'code');
    select id into v_account_id from accounts where code = v_code;
    insert into account_import_lines (batch_id, account_id, code, amount, description)
    values (v_batch_id, v_account_id, v_code, (v_row->>'amount')::numeric, nullif(trim(coalesce(v_row->>'description', '')), ''));
    v_count := v_count + 1;
  end loop;

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNT_FILE', 'AccountImport',
    format('นำเข้าไฟล์%s (%s) %s รายการ ปี %s%s',
      case p_batch_type when 'trial_balance' then 'งบทดลอง' else 'รายจ่าย' end,
      coalesce(p_file_name, '(ไม่ทราบชื่อไฟล์)'), v_count, p_year,
      case when p_month is not null then format(' เดือน %s', p_month) else '' end));

  return jsonb_build_object('success', true, 'message', format('นำเข้าสำเร็จ %s รายการ', v_count), 'batchId', v_batch_id, 'imported', v_count);
end;
$$;

-- ─────────────────────────────────────────────
-- get_import_batches — ดูประวัติการนำเข้าไฟล์งบทดลอง/รายจ่าย แยกตามประเภท
-- ─────────────────────────────────────────────
create or replace function get_import_batches(p_actor_id text, p_batch_type text default null)
returns table (
  id bigint, batch_type text, year int, month int, file_name text,
  uploaded_by text, uploaded_by_name text, uploaded_at timestamptz, line_count bigint, total_amount numeric
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติการนำเข้าไฟล์บัญชี';
  end if;

  return query
  select b.id, b.batch_type, b.year, b.month, b.file_name, b.uploaded_by, u.name,
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

-- ─────────────────────────────────────────────
-- get_import_batch_detail — ดูรายละเอียดรายบรรทัดของไฟล์ที่นำเข้าไปแล้ว 1 ไฟล์
-- ─────────────────────────────────────────────
create or replace function get_import_batch_detail(p_actor_id text, p_batch_id bigint)
returns table (code text, name text, amount numeric, description text)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายละเอียดการนำเข้า';
  end if;

  return query
  select l.code, a.name, l.amount, l.description
  from account_import_lines l
  join accounts a on a.id = l.account_id
  where l.batch_id = p_batch_id
  order by l.code;
end;
$$;

-- ─────────────────────────────────────────────
-- default permission: 'account-import' — ADMIN เท่านั้น default (แนบไฟล์บัญชี
-- เป็นงานละเอียดอ่อน ให้ ADMIN มอบสิทธิ์เองถ้าต้องการให้หัวหน้าบัญชีทำได้)
-- ─────────────────────────────────────────────
update users set page_permissions = page_permissions || '["account-import"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'account-import');
