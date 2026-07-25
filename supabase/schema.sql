-- ============================================================
-- GoCost (คุมค่าใช้จ่าย) — Supabase schema
-- ผังตารางนี้ map 1:1 กับ 9 ชีตใน GoCost.xlsx เดิม
-- รันไฟล์นี้ใน Supabase SQL editor ครั้งเดียวตอน setup โปรเจกต์
-- ============================================================

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 1) users  (มาจากชีต "User": id, password, role, name, fullName, email)
-- ─────────────────────────────────────────────
create table if not exists users (
  id            text primary key,        -- เดิม column A: id (เช่น "Kanok500")
  password_hash text not null,           -- เก็บเป็น bcrypt hash เสมอ (ไม่เก็บ plaintext)
  role          text not null,           -- เช่น เซลล์ / ผู้บริหาร / บัญชี
  name          text not null,
  full_name     text,
  email         text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2) documents  (ชีต "Documents": doc_number, type, status, store, scheduled_date, details, created_by, created_at)
-- ─────────────────────────────────────────────
create table if not exists documents (
  doc_number     text primary key,
  type           text not null,          -- เช่น 'Workshop'
  status         text not null,
  store          text,
  scheduled_date date,
  details        jsonb,
  created_by     text references users(id),
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3) audit_logs  (ชีต "Audit_Logs")
-- ─────────────────────────────────────────────
create table if not exists audit_logs (
  log_id     text primary key,
  "timestamp" timestamptz not null default now(),
  user_id    text references users(id),
  action     text not null,
  module     text,
  details    text
);

-- ─────────────────────────────────────────────
-- 4) pending_edits  (ชีต "Pending_Edits" — workflow ขออนุมัติแก้ไข/ลบ)
-- ─────────────────────────────────────────────
create table if not exists pending_edits (
  edit_id             text primary key,
  original_sheet_name text not null,     -- ชื่อ "ตาราง" เดิมที่ขอแก้ (เก็บไว้ compat กับของเดิม)
  original_row_id     text not null,     -- อ้างอิง doc_number ของแถวที่ขอแก้/ลบ
  requested_by        text references users(id),
  request_timestamp   timestamptz not null default now(),
  new_data_json       jsonb,
  status              text not null default 'pending',  -- pending | approved | rejected
  admin_note          text,
  processed_at        timestamptz
);

-- ─────────────────────────────────────────────
-- 5) expense_records  (ชีต "บันทึกค่าใช้จ่าย" — ตารางหลักของแอพ)
-- คอลัมน์เดิม A-N: เลขที่เอกสาร, ลำดับ, ชื่อร้านค้า, วันที่จัด, จำนวนผู้เข้างาน,
--                   จำนวนวันทำงาน, ประเภทค่าใช้จ่าย, รายละเอียด, จำนวน, หน่วย,
--                   ราคาต่อหน่วย, ราคารวม, หมายเหตุ, ไฟล์แนบ
-- หมายเหตุการออกแบบ: เปลี่ยน "วันที่จัด" จาก text ภาษาไทย (dd/MM/พ.ศ.) เดิม
-- ให้เป็น DATE จริงใน DB แล้วค่อยแปลงเป็น พ.ศ. ตอนแสดงผลที่ frontend แทน
-- (ปรับแค่รูปแบบเก็บข้อมูล ไม่กระทบ validation/logic เดิมเลย)
-- ─────────────────────────────────────────────
create table if not exists expense_records (
  doc_number    text not null,
  seq           int not null,
  store_name    text not null,
  event_date    date not null,
  attendees     int default 0,
  work_days     int default 0,
  main_category text not null,
  detail        text not null,
  qty           numeric not null check (qty > 0),
  unit          text,
  unit_price    numeric not null check (unit_price >= 0),
  total         numeric generated always as (round(qty * unit_price, 2)) stored,
  remark        text,
  internal_note text,
  attachment_url text,
  created_by    text references users(id),
  created_at    timestamptz not null default now(),
  primary key (doc_number, seq)
);
create index if not exists idx_expense_records_doc_number on expense_records(doc_number);
create index if not exists idx_expense_records_event_date on expense_records(event_date);
create index if not exists idx_expense_records_store_name on expense_records(store_name);

-- ─────────────────────────────────────────────
-- 6) plan_workshop  (ชีต "PlanWorkshop")
-- ─────────────────────────────────────────────
create table if not exists plan_workshop (
  seq            int generated always as identity primary key,
  doc_number     text,
  store_name     text,
  location       text,
  scheduled_date date,
  created_by     text references users(id),
  status         text
);

-- ─────────────────────────────────────────────
-- 7) notifications  (ชีต "Notifications")
-- ─────────────────────────────────────────────
create table if not exists notifications (
  notif_id    text primary key,
  target_role text,
  target_user text,
  message     text not null,
  link_id     text,
  status      int not null default 0,  -- 0 = unread, 1 = read (ตามของเดิม)
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Document number generator — พอร์ตจาก generateDocumentNumber_() เดิม
-- รูปแบบ: PV[ปี ค.ศ.][running 6 หลัก] เช่น PV2026000007
-- ใช้ advisory lock แทน LockService ของ GAS (กันเลขซ้ำเมื่อบันทึกพร้อมกัน)
-- ============================================================
create or replace function generate_document_number()
returns text
language plpgsql
as $$
declare
  current_year text := to_char(now(), 'YYYY');
  last_doc_no text;
  running_num int;
  new_doc_no text;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_doc_number_lock'));

  select doc_number into last_doc_no
  from expense_records
  where doc_number like 'PV' || current_year || '%'
  order by doc_number desc
  limit 1;

  if last_doc_no is null then
    new_doc_no := 'PV' || current_year || '000001';
  else
    running_num := (substring(last_doc_no from 7))::int + 1;
    new_doc_no := 'PV' || current_year || lpad(running_num::text, 6, '0');
  end if;

  return new_doc_no;
end;
$$;

-- ============================================================
-- Login แบบปลอดภัย — เทียบ password ฝั่ง server ผ่าน RPC เดียว
-- client ไม่มีทางอ่าน column password_hash ได้โดยตรงเลย (ดู RLS ด้านล่าง)
-- ============================================================
create or replace function login_user(p_id text, p_password text)
returns table (id text, role text, name text, full_name text, email text)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.role, u.name, u.full_name, u.email
  from users u
  where u.id = p_id
    and u.password_hash = crypt(p_password, u.password_hash);
end;
$$;

-- ============================================================
-- Row Level Security
-- โมเดลนี้ใช้ระบบ login ของตัวเอง (ไม่ใช่ Supabase Auth) เหมือนของเดิม
-- ดังนั้นปิดการเข้าถึงตรงจาก client ทั้งหมด แล้วบังคับให้ผ่าน RPC/Edge Function
-- ที่ใช้ service_role key เท่านั้น — ป้องกัน anon key เห็น password_hash หรือแก้ข้อมูลตรงๆ
-- ============================================================
alter table users enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;
alter table pending_edits enable row level security;
alter table expense_records enable row level security;
alter table plan_workshop enable row level security;
alter table notifications enable row level security;

-- ไม่สร้าง policy ใดๆ ให้ anon/authenticated โดยเจตนา
-- => ทุกการอ่าน/เขียนต้องผ่าน RPC (security definer) หรือ service_role key ฝั่ง server เท่านั้น

-- ============================================================
-- save_expense_record — พอร์ตจาก saveExpenseData(payload) เดิมแบบ 1:1
-- รับ items เป็น jsonb array ของ {mainCategory, detail, qty, unitPrice, unit, remark}
-- validation กฎเดิมทุกข้อ: storeName, eventDate, items ต้องมีอย่างน้อย 1,
-- แต่ละ item ต้องมี mainCategory/detail และ qty>0, unitPrice>=0
-- ============================================================
create or replace function save_expense_record(
  p_store_name text,
  p_event_date date,
  p_attendees int,
  p_work_days int,
  p_internal_note text,
  p_created_by text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_doc_no text;
  v_item jsonb;
  v_seq int := 0;
  v_qty numeric;
  v_unit_price numeric;
begin
  if p_store_name is null or trim(p_store_name) = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า / ชื่องาน');
  end if;
  if p_event_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่จัดงาน');
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    if coalesce(trim(v_item->>'mainCategory'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกหมวดหมู่หลัก', v_seq));
    end if;
    if coalesce(trim(v_item->>'detail'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกรายละเอียด', v_seq));
    end if;
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    if v_qty is null or v_qty <= 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: จำนวนต้องมากกว่า 0', v_seq));
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: ราคาต่อหน่วยไม่ถูกต้อง', v_seq));
    end if;
  end loop;

  v_doc_no := generate_document_number();
  v_seq := 0;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, created_by
    ) values (
      v_doc_no, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, '')), p_created_by
    );
  end loop;

  insert into audit_logs (log_id, user_id, action, module, details)
  values ('LOG' || (extract(epoch from clock_timestamp()) * 1000)::bigint, p_created_by,
          'สร้างเอกสาร: ' || v_doc_no, 'บันทึกค่าใช้จ่าย', v_doc_no);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ', 'docNo', v_doc_no, 'rowsSaved', v_seq);
end;
$$;

-- ============================================================
-- get_expense_history — พอร์ตจาก getHistoryData() เดิม
-- ============================================================
create or replace function get_expense_history()
returns setof expense_records
language sql
security definer
as $$
  select * from expense_records order by doc_number desc, seq asc;
$$;
