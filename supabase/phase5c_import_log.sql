-- ============================================================
-- GoCost — Phase 5c: ประวัติการนำเข้ารหัสบัญชี
-- รันหลัง phase5b_budgets.sql
-- ============================================================

create table if not exists account_import_logs (
  id            bigint generated always as identity primary key,
  imported_by   text references users(id),
  imported_at   timestamptz not null default now(),
  file_name     text,
  new_count     int not null default 0,
  skipped_count int not null default 0
);

alter table account_import_logs enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- bulk_import_accounts — เพิ่ม p_file_name แล้วบันทึกลง account_import_logs ทุกครั้ง
-- ที่นำเข้า (แม้ import 0 รายการใหม่ก็บันทึกไว้ เพื่อให้เห็นประวัติครบว่าใครลองนำเข้า
-- ไฟล์อะไรบ้าง) — ต้อง drop ก่อนเพราะเปลี่ยน signature จากเฟส 5a เดิม
-- ─────────────────────────────────────────────
drop function if exists bulk_import_accounts(text, jsonb);
create or replace function bulk_import_accounts(p_actor_id text, p_rows jsonb, p_file_name text default null)
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

  insert into account_import_logs (imported_by, file_name, new_count, skipped_count)
  values (p_actor_id, p_file_name, v_count, v_skipped);

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNTS', 'Accounts',
    format('นำเข้ารหัสบัญชีใหม่ %s รายการ จากไฟล์ %s (ข้าม %s รายการที่มีอยู่แล้ว)', v_count, coalesce(p_file_name, '(ไม่ทราบชื่อไฟล์)'), v_skipped));
  return jsonb_build_object('success', true, 'message', format('นำเข้ารหัสบัญชีใหม่สำเร็จ %s รายการ', v_count), 'imported', v_count, 'skipped', v_skipped);
end;
$$;

-- ─────────────────────────────────────────────
-- get_import_logs — ดูประวัติการนำเข้า (ใช้สิทธิ์ 'accounts' เดียวกัน)
-- ─────────────────────────────────────────────
create or replace function get_import_logs(p_actor_id text)
returns table (
  id bigint, imported_by text, imported_by_name text,
  imported_at timestamptz, file_name text, new_count int, skipped_count int
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติการนำเข้า';
  end if;

  return query
  select l.id, l.imported_by, u.name, l.imported_at, l.file_name, l.new_count, l.skipped_count
  from account_import_logs l
  left join users u on u.id = l.imported_by
  order by l.imported_at desc
  limit 100;
end;
$$;
