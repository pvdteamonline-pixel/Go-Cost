-- ============================================================
-- GoCost — Phase 4b: ระบบวางแผน Workshop (โมเดลใหม่ทั้งหมด ตามที่ออกแบบร่วมกัน)
-- รันหลัง phase4a_stores.sql + phase4a_stores_seed.sql
--
-- สถานะของ workshop_plans (status):
--   pending_approval    → เซลล์เพิ่งสร้าง รอผู้มีสิทธิ์อนุมัติ (permission 'workshop-approve')
--   rejected            → ถูกปฏิเสธ จบ flow
--   awaiting_sales_data → อนุมัติแล้ว รอเซลล์กรอกข้อมูลหลังจบงาน
--   pending_accounting  → เซลล์กรอกข้อมูลแล้ว รอบัญชีลงค่าใช้จ่าย (permission 'workshop-accounting')
--   completed           → บัญชีลงข้อมูลเสร็จ จบ flow เต็มรูปแบบ
-- ============================================================

create table if not exists workshop_plans (
  id                     text primary key,           -- 'WS' + timestamp เหมือน convention เดิมของแอพ
  store_id               bigint not null references stores(id),
  planned_date           date not null,               -- วันที่วางแผนจัดงาน (เซลล์เลือกเอง)
  status                 text not null default 'pending_approval',
  created_by             text not null references users(id),
  created_at             timestamptz not null default now(),
  approved_by            text references users(id),
  approved_at            timestamptz,
  admin_note             text,
  -- ข้อมูลที่เซลล์กรอกหลังจบงาน
  attendees              int,
  sales_push_amount      numeric,        -- "ยอดขายดันเข้าร้านค้า" — นับเป็นรายได้บริษัทจริง
  workshop_sales_amount  numeric,        -- "ยอดขาย workshop" — ยอดขายของร้าน ไม่นับเป็นรายได้บริษัท
  attachment_path        text,           -- path ใน Supabase Storage bucket 'workshop-attachments'
  sales_data_submitted_at timestamptz,
  -- ผลตอนบัญชีลงข้อมูลเสร็จ
  accounting_doc_number  text,           -- อ้างอิงเลขที่เอกสารใน expense_records ที่บัญชีสร้างขึ้น
  accounting_completed_by text references users(id),
  accounting_completed_at timestamptz
);

create index if not exists idx_workshop_plans_status on workshop_plans(status);
create index if not exists idx_workshop_plans_created_by on workshop_plans(created_by);

alter table workshop_plans enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- create_workshop_plan — สร้างคำขอใหม่ (เซลล์) สถานะเริ่มต้น pending_approval
-- ─────────────────────────────────────────────
create or replace function create_workshop_plan(p_store_id bigint, p_planned_date date, p_created_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id text := 'WS' || (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_store_name text;
begin
  if not has_page_permission(p_created_by, 'workshop-plan') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์สร้างคำขอ Workshop');
  end if;
  if p_store_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกร้านค้า');
  end if;
  if p_planned_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่วางแผนจัดงาน');
  end if;

  select name into v_store_name from stores where id = p_store_id;
  if v_store_name is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  insert into workshop_plans (id, store_id, planned_date, created_by)
  values (v_id, p_store_id, p_planned_date, p_created_by);

  perform add_notification('', '', format('%s เสนอแผน Workshop ร้าน %s วันที่ %s', p_created_by, v_store_name, p_planned_date), v_id);
  perform write_audit_log(p_created_by, 'CREATE_WORKSHOP', 'Workshop_Plans', format('สร้างแผน: %s (%s)', v_id, v_store_name));

  return jsonb_build_object('success', true, 'planId', v_id, 'message', 'ส่งคำขอ Workshop เรียบร้อย รอผู้มีสิทธิ์อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_plans — ต้องมีสิทธิ์อย่างน้อย 1 ใน 3 หน้า workshop ถึงจะเรียกได้
-- คืนมาทั้งหมด ให้ frontend กรองตาม status ตามแต่ละหน้าเอง
-- ─────────────────────────────────────────────
create or replace function get_workshop_plans(p_actor_id text)
returns table (
  id text, store_id bigint, store_name text, region text, province text,
  assigned_sales_name text, planned_date date, status text,
  created_by text, created_at timestamptz, approved_by text, approved_at timestamptz, admin_note text,
  attendees int, sales_push_amount numeric, workshop_sales_amount numeric,
  attachment_path text, sales_data_submitted_at timestamptz,
  accounting_doc_number text, accounting_completed_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not (has_page_permission(p_actor_id, 'workshop-plan')
       or has_page_permission(p_actor_id, 'workshop-approve')
       or has_page_permission(p_actor_id, 'workshop-accounting')) then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูล Workshop';
  end if;

  return query
  select wp.id, wp.store_id, s.name, s.region, s.province, u.name,
         wp.planned_date, wp.status, wp.created_by, wp.created_at,
         wp.approved_by, wp.approved_at, wp.admin_note,
         wp.attendees, wp.sales_push_amount, wp.workshop_sales_amount,
         wp.attachment_path, wp.sales_data_submitted_at,
         wp.accounting_doc_number, wp.accounting_completed_at
  from workshop_plans wp
  join stores s on s.id = wp.store_id
  left join users u on u.id = s.assigned_sales_id
  order by wp.created_at desc;
end;
$$;

-- ─────────────────────────────────────────────
-- approve_workshop_plan / reject_workshop_plan — ต้องมีสิทธิ์ 'workshop-approve'
-- ─────────────────────────────────────────────
create or replace function approve_workshop_plan(p_plan_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  if not has_page_permission(p_actor_id, 'workshop-approve') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติ Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  update workshop_plans set status = 'awaiting_sales_data', approved_by = p_actor_id, approved_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('แผน Workshop %s ได้รับการอนุมัติแล้ว — กรอกข้อมูลหลังงานได้เลย', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'APPROVE_WORKSHOP', 'Workshop_Plans', 'อนุมัติ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติแผน Workshop สำเร็จ');
end;
$$;

create or replace function reject_workshop_plan(p_plan_id text, p_admin_note text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  if not has_page_permission(p_actor_id, 'workshop-approve') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ปฏิเสธ Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  update workshop_plans set status = 'rejected', admin_note = coalesce(p_admin_note, ''), approved_by = p_actor_id, approved_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('แผน Workshop %s ถูกปฏิเสธ: %s', p_plan_id, coalesce(p_admin_note, '-')), p_plan_id);
  perform write_audit_log(p_actor_id, 'REJECT_WORKSHOP', 'Workshop_Plans', 'ปฏิเสธ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'ปฏิเสธแผน Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- submit_workshop_sales_data — เซลล์กรอกข้อมูลหลังจบงาน (เฉพาะเจ้าของแผนเท่านั้น)
-- แยก 2 ยอดขายตามที่คุยกัน: sales_push_amount (นับรายได้บริษัท) กับ
-- workshop_sales_amount (ไม่นับ แยกหมวดใน dashboard ต่างหาก)
-- ─────────────────────────────────────────────
create or replace function submit_workshop_sales_data(
  p_plan_id text, p_attendees int, p_sales_push_amount numeric,
  p_workshop_sales_amount numeric, p_attachment_path text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.created_by <> p_actor_id then
    return jsonb_build_object('success', false, 'message', 'คุณไม่ใช่เจ้าของแผนนี้');
  end if;
  if v_row.status <> 'awaiting_sales_data' then
    return jsonb_build_object('success', false, 'message', 'แผนนี้ไม่ได้อยู่ในสถานะรอกรอกข้อมูล');
  end if;
  if p_attendees is null or p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกจำนวนคนเข้างานให้ถูกต้อง');
  end if;
  if p_sales_push_amount is null or p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขายดันเข้าร้านค้าให้ถูกต้อง');
  end if;
  if p_workshop_sales_amount is null or p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขาย Workshop ให้ถูกต้อง');
  end if;

  update workshop_plans set
    attendees = p_attendees,
    sales_push_amount = p_sales_push_amount,
    workshop_sales_amount = p_workshop_sales_amount,
    attachment_path = p_attachment_path,
    sales_data_submitted_at = now(),
    status = 'pending_accounting'
  where id = p_plan_id;

  perform add_notification('บัญชี', '', format('Workshop %s รอบัญชีลงข้อมูล', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'SUBMIT_WORKSHOP_DATA', 'Workshop_Plans', 'กรอกข้อมูลหลังงาน: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ ส่งไปรอบัญชีลงข้อมูลแล้ว');
end;
$$;

-- ─────────────────────────────────────────────
-- complete_workshop_accounting — บัญชีลงรายจ่ายจริงของงาน (ต้องมีสิทธิ์ 'workshop-accounting')
-- p_items: รายการค่าใช้จ่ายแบบเดียวกับ save_expense_record (mainCategory/detail/qty/unit/unitPrice/remark)
-- ระบบจะเติมแถวรายได้ "ยอดขายดันเข้าร้านค้า" ให้อัตโนมัติ (mainCategory='รายได้',
-- detail='ยอดขายดันสินค้าเข้า') ต่อจากรายการที่บัญชีกรอกเอง โดยใช้ตัวเลขที่เซลล์กรอกไว้แล้ว
-- ทั้งหมดถูกบันทึกเป็นเอกสารเดียวกันใน expense_records (ออกเลขที่เอกสารใหม่)
-- ─────────────────────────────────────────────
create or replace function complete_workshop_accounting(p_plan_id text, p_items jsonb, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_store_name text;
  v_doc_no text;
  v_item jsonb;
  v_seq int := 0;
  v_qty numeric;
  v_unit_price numeric;
begin
  if not has_page_permission(p_actor_id, 'workshop-accounting') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลงข้อมูลบัญชี Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_accounting' then
    return jsonb_build_object('success', false, 'message', 'แผนนี้ไม่ได้อยู่ในสถานะรอบัญชีลงข้อมูล');
  end if;

  select name into v_store_name from stores where id = v_row.store_id;

  -- validation รายการที่บัญชีกรอกเอง (เหมือน save_expense_record)
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
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

  -- 1) รายการค่าใช้จ่ายที่บัญชีกรอกเอง
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, created_by
    ) values (
      v_doc_no, v_seq, v_store_name, v_row.planned_date, v_row.attendees, 1,
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      format('Workshop %s', p_plan_id), p_actor_id
    );
  end loop;

  -- 2) แถวรายได้ "ยอดขายดันเข้าร้านค้า" เติมให้อัตโนมัติจากตัวเลขที่เซลล์กรอกไว้แล้ว
  v_seq := v_seq + 1;
  insert into expense_records (
    doc_number, seq, store_name, event_date, attendees, work_days,
    main_category, detail, qty, unit, unit_price, remark, internal_note, created_by
  ) values (
    v_doc_no, v_seq, v_store_name, v_row.planned_date, v_row.attendees, 1,
    'รายได้', 'ยอดขายดันสินค้าเข้า', 1, 'ครั้ง', v_row.sales_push_amount, '',
    format('Workshop %s — ยอดขายดันเข้าร้านค้าจากเซลล์', p_plan_id), p_actor_id
  );

  update workshop_plans set
    status = 'completed',
    accounting_doc_number = v_doc_no,
    accounting_completed_by = p_actor_id,
    accounting_completed_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('Workshop %s ลงบัญชีเสร็จสิ้นแล้ว เอกสารเลขที่ %s', p_plan_id, v_doc_no), v_doc_no);
  perform write_audit_log(p_actor_id, 'COMPLETE_WORKSHOP_ACCOUNTING', 'Workshop_Plans', format('%s → เอกสาร %s', p_plan_id, v_doc_no));

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลบัญชีสำเร็จ จบกระบวนการ Workshop', 'docNo', v_doc_no);
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_sales_summary — ยอดขาย Workshop แยกต่างหากสำหรับ Dashboard
-- (ไม่รวมกับ totalExpenses/totalIncome ใดๆ ใน get_dashboard_stats เดิมเลย)
-- ─────────────────────────────────────────────
create or replace function get_workshop_sales_summary(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_total_workshop_sales numeric := 0;
  v_total_push_sales numeric := 0;
  v_count int := 0;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  select coalesce(sum(workshop_sales_amount), 0), coalesce(sum(sales_push_amount), 0), count(*)
  into v_total_workshop_sales, v_total_push_sales, v_count
  from workshop_plans
  where status = 'completed'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  return jsonb_build_object(
    'success', true,
    'totalWorkshopSales', v_total_workshop_sales,
    'totalPushSales', v_total_push_sales,
    'completedCount', v_count
  );
end;
$$;

-- ============================================================
-- Supabase Storage: bucket สำหรับไฟล์แนบ Workshop (แทน Google Drive เดิม)
-- ต้องรันส่วนนี้ด้วย — สร้าง bucket ผ่าน SQL ได้เลยไม่ต้องกดในหน้า Dashboard
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('workshop-attachments', 'workshop-attachments', false, 10485760) -- 10MB ตามที่กำหนด
on conflict (id) do nothing;

-- ⚠️ หมายเหตุสำคัญเรื่องความปลอดภัยของไฟล์แนบ (อ่านก่อนใช้งานจริง):
-- ระบบนี้ไม่ได้ใช้ Supabase Auth จริง (login เป็นระบบที่เขียนเอง) ทำให้ Storage RLS
-- ไม่สามารถเช็คได้ว่า "ใครคือเจ้าของไฟล์" แบบเดียวกับที่ RPC ทุกตัวในระบบนี้ก็เช็คสิทธิ์
-- ผ่านการส่ง p_actor_id เข้ามาเองเช่นกัน ไม่ได้พึ่ง RLS ของ Postgres เลย — bucket นี้จึง
-- ต้องเปิดให้ anon key เขียน/อ่านได้ (เหมือน RPC ทุกตัวที่ anon key เรียกได้หมด อาศัย
-- การเช็คสิทธิ์ข้างในฟังก์ชันแทน) พูดอีกแบบคือใครก็ตามที่มี anon key และรู้ path ไฟล์
-- (ซึ่งมี plan_id แบบสุ่มปนอยู่ เดายาก) จะเปิดไฟล์ได้ — ระดับความเสี่ยงเทียบเท่ากับ
-- RPC อื่นๆ ในระบบนี้ทั้งหมด ไม่ได้ต่ำกว่าหรือสูงกว่า
drop policy if exists "workshop attachments insert via anon" on storage.objects;
create policy "workshop attachments insert via anon"
  on storage.objects for insert to anon
  with check (bucket_id = 'workshop-attachments');

drop policy if exists "workshop attachments select via anon" on storage.objects;
create policy "workshop attachments select via anon"
  on storage.objects for select to anon
  using (bucket_id = 'workshop-attachments');

