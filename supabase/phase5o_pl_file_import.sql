-- ============================================================
-- GoCost — Phase 5o: แนบไฟล์เหลือแบบเดียว "ประมาณการกำไรขาดทุน" (หลายเดือนในไฟล์เดียว)
-- รันหลัง phase5n_revert_auto_groups.sql
--
-- แทนที่ดีไซน์เดิม (งบทดลอง + ไฟล์รายจ่าย แยก 2 ประเภท, 1 batch = 1 เดือน)
-- ด้วยไฟล์เดียวที่หัวหน้าฝ่ายบัญชีอัปโหลด ซึ่งมีข้อมูลหลายเดือนในไฟล์เดียว
-- (คอลัมน์เดือน ม.ค., ก.พ., ... ในชีตเดียว) — เก็บเดือนไว้ที่ระดับ "บรรทัด" แทน
-- ระดับ "ไฟล์" เพื่อรองรับหลายเดือนต่อการอัปโหลด 1 ครั้ง
-- ============================================================

alter table account_import_lines add column if not exists month int;

alter table account_import_batches drop constraint if exists account_import_batches_batch_type_check;
alter table account_import_batches add constraint account_import_batches_batch_type_check
  check (batch_type in ('trial_balance', 'expense_file', 'pl_estimate'));

-- ─────────────────────────────────────────────
-- import_account_file — รองรับหลายเดือนต่อไฟล์: แต่ละแถวใน p_rows มี month ของ
-- ตัวเอง (ไม่ใช้ p_month ระดับไฟล์อีกต่อไป) — ต้อง drop ก่อนเพราะเปลี่ยน signature
-- ─────────────────────────────────────────────
drop function if exists import_account_file(text, text, int, int, text, jsonb);
create or replace function import_account_file(
  p_actor_id text, p_batch_type text, p_year int, p_file_name text, p_rows jsonb
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
  if p_batch_type not in ('trial_balance', 'expense_file', 'pl_estimate') then
    return jsonb_build_object('success', false, 'message', 'ประเภทไฟล์ไม่ถูกต้อง');
  end if;
  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return jsonb_build_object('success', false, 'message', 'ไม่มีข้อมูลให้นำเข้า');
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null or not exists (select 1 from accounts where code = v_code) then
      return jsonb_build_object('success', false, 'message',
        format('รหัสบัญชี %s ไม่มีในระบบ กรุณาเพิ่มในหน้า "จัดการรหัสบัญชี" ก่อน แล้วนำเข้าใหม่', coalesce(v_code, '(ว่าง)')));
    end if;
  end loop;

  insert into account_import_batches (batch_type, year, month, file_name, uploaded_by)
  values (p_batch_type, p_year, null, p_file_name, p_actor_id)
  returning id into v_batch_id;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := trim(v_row->>'code');
    select id into v_account_id from accounts where code = v_code;
    insert into account_import_lines (batch_id, account_id, code, amount, month, description)
    values (
      v_batch_id, v_account_id, v_code, (v_row->>'amount')::numeric,
      nullif(v_row->>'month', '')::int,
      nullif(trim(coalesce(v_row->>'description', '')), '')
    );
    v_count := v_count + 1;
  end loop;

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNT_FILE', 'AccountImport',
    format('นำเข้าไฟล์ประมาณการกำไรขาดทุน (%s) %s รายการ ปี %s',
      coalesce(p_file_name, '(ไม่ทราบชื่อไฟล์)'), v_count, p_year));

  return jsonb_build_object('success', true, 'message', format('นำเข้าสำเร็จ %s รายการ', v_count), 'batchId', v_batch_id, 'imported', v_count);
end;
$$;

-- ─────────────────────────────────────────────
-- get_import_batches — เปลี่ยนให้โชว์ช่วงเดือนที่มีข้อมูล (min-max month ของ line
-- ในนั้น) แทน month ระดับไฟล์เดี่ยว
-- ─────────────────────────────────────────────
drop function if exists get_import_batches(text, text);
create or replace function get_import_batches(p_actor_id text, p_batch_type text default null)
returns table (
  id bigint, batch_type text, year int, month_range text, file_name text,
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
  select b.id, b.batch_type, b.year,
         case when min(l.month) is null then '-'
              when min(l.month) = max(l.month) then min(l.month)::text
              else min(l.month)::text || '-' || max(l.month)::text end,
         b.file_name, b.uploaded_by, u.name,
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
-- get_reconciliation_report — อัปเดตให้ดึงยอดจากไฟล์ตาม month ระดับ line แทน
-- batch.month (logic เปลี่ยน แม้ signature เดิม)
-- ─────────────────────────────────────────────
create or replace function get_reconciliation_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_rows jsonb := '[]'::jsonb;
  a record;
  v_staff_amount numeric;
  v_file_amount numeric;
begin
  if not has_page_permission(p_actor_id, 'reconciliation') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานเทียบยอด');
  end if;

  for a in
    select distinct a.id, a.code, a.name
    from accounts a
    where exists (
      select 1 from expense_records e where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month)
    ) or exists (
      select 1 from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.year = p_year
        and (p_month is null or l.month = p_month)
    )
    order by a.code
  loop
    select coalesce(sum(e.total), 0) into v_staff_amount
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    select coalesce(sum(l.amount), 0) into v_file_amount
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id and b.year = p_year
      and (p_month is null or l.month = p_month);

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name,
      'staffAmount', v_staff_amount, 'fileAmount', v_file_amount,
      'diff', v_file_amount - v_staff_amount
    ));
  end loop;

  return jsonb_build_object('success', true, 'year', p_year, 'month', p_month, 'rows', v_rows);
end;
$$;
