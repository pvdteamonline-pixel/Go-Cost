-- ============================================================
-- GoCost — Phase 4a: ตารางร้านค้า/ลูกค้า (รันก่อน phase4a_stores_seed.sql)
-- ใช้เป็นแหล่งข้อมูลของ dropdown ค้นหาร้านค้าตอนสร้างคำขอ Workshop
-- ============================================================

create table if not exists stores (
  id                bigint generated always as identity primary key,
  customer_code     text,               -- รหัสลูกค้าจากไฟล์เดิม (ไม่ unique — พบโค้ดซ้ำ/placeholder ในข้อมูลจริง)
  name              text not null,
  region            text,               -- ภาค
  province          text,               -- จังหวัด/อำเภอ/เขต
  address           text,
  phone             text,
  assigned_sales_id text references users(id),  -- ไม่มีในไฟล์ต้นฉบับ — ต้องกำหนดทีหลังเอง
  created_at        timestamptz not null default now()
);

create index if not exists idx_stores_name on stores using gin (to_tsvector('simple', name));
create index if not exists idx_stores_customer_code on stores(customer_code);

alter table stores enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- search_stores — ใช้กับ dropdown ค้นหาร้านค้า พิมพ์ชื่อ/รหัส/จังหวัดแล้วค้นได้
-- คืนชื่อเซลล์ที่สังกัดมาด้วย (ถ้ามีการกำหนดไว้)
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
         s.assigned_sales_id, u.name as assigned_sales_name
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
-- assign_store_salesperson — กำหนด/เปลี่ยนเซลล์ที่สังกัดร้าน (ต้องมีสิทธิ์หน้า users
-- หรือ workshop-plan เป็นผู้กำหนด — ใช้ 'users' เพราะเป็นงานเชิงจัดการข้อมูลบุคคล)
-- ─────────────────────────────────────────────
create or replace function assign_store_salesperson(p_store_id bigint, p_sales_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์กำหนดเซลล์ประจำร้าน');
  end if;
  update stores set assigned_sales_id = nullif(p_sales_id, '') where id = p_store_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;
  return jsonb_build_object('success', true, 'message', 'กำหนดเซลล์ประจำร้านสำเร็จ');
end;
$$;
