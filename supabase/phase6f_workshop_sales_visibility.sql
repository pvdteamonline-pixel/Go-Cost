-- Restrict sales Workshop reads to the submitting user, irrespective of page grants.
-- Apply after phase6e. This changes read functions only; no business rows are edited.
begin;
set local lock_timeout = '5s';

create or replace function public.get_workshop_plans(p_actor_id text)
returns table (
 id text, store_id bigint, store_name text, region text, province text,
 assigned_sales_name text, planned_date date, status text,
 created_by text, created_at timestamptz, approved_by text, approved_at timestamptz, admin_note text,
 attendees int, sales_push_amount numeric, workshop_sales_amount numeric,
 attachment_path text, sales_data_submitted_at timestamptz,
 accounting_doc_number text, accounting_completed_at timestamptz
)
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor_role text;
begin
 select u.role into actor_role from public.users u where u.id=p_actor_id;
 if actor_role is null then raise exception 'ไม่พบผู้ใช้งาน'; end if;
 if not (has_page_permission(p_actor_id,'workshop-plan-create')
      or has_page_permission(p_actor_id,'workshop-plan-view')
      or has_page_permission(p_actor_id,'workshop-approve')) then
  raise exception 'คุณไม่มีสิทธิ์ดูข้อมูล Workshop';
 end if;
 return query
 select wp.id,wp.store_id,coalesce(nullif(wp.request_details->>'party_name',''),s.name),s.region,s.province,u.name,
        wp.planned_date,wp.status,wp.created_by,wp.created_at,wp.approved_by,wp.approved_at,wp.admin_note,
        wp.attendees,wp.sales_push_amount,wp.workshop_sales_amount,wp.attachment_path,wp.sales_data_submitted_at,
        wp.accounting_doc_number,wp.accounting_completed_at
 from public.workshop_plans wp
 left join public.stores s on s.id=wp.store_id
 left join public.users u on u.id=s.assigned_sales_id
 where actor_role<>'เซลล์' or wp.created_by=p_actor_id
 order by wp.created_at desc;
end; $$;

create or replace function public.get_operational_report(p_actor_id text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare expenses jsonb:='[]'; workshops jsonb:='[]'; requests jsonb:='[]'; archived jsonb:='[]';
 can_expense boolean; can_workshop boolean; actor_role text;
begin
 select role into actor_role from public.users where id=p_actor_id;
 if actor_role is null then raise exception 'ไม่พบผู้ใช้งาน'; end if;
 can_expense:=has_page_permission(p_actor_id,'expense-history') or has_page_permission(p_actor_id,'expense-report');
 can_workshop:=has_page_permission(p_actor_id,'workshop-plan-view') or has_page_permission(p_actor_id,'workshop-approve');
 if not(can_expense or can_workshop) then raise exception 'คุณไม่มีสิทธิ์ดูรายงานนี้'; end if;
 if can_expense then
  select coalesce(jsonb_agg(to_jsonb(e) order by e.event_date desc,e.doc_number,e.seq),'[]') into expenses from expense_records e;
  select coalesce(jsonb_agg(to_jsonb(e)),'[]') into requests from (select original_row_id,status from pending_edits where status in ('pending_edit','pending_delete')) e;
 end if;
 if can_workshop then
  select coalesce(jsonb_agg(to_jsonb(w) order by w.planned_date desc),'[]') into workshops from
   (select wp.*,coalesce(nullif(wp.request_details->>'party_name',''),s.name) as store_name
    from workshop_plans wp left join stores s on s.id=wp.store_id
    where wp.created_by=p_actor_id or (actor_role<>'เซลล์' and has_page_permission(p_actor_id,'workshop-approve'))) w;
 end if;
 select coalesce(jsonb_agg(to_jsonb(a)),'[]') into archived from operational_document_archive a
 where (document_type='PV' and can_expense)
    or (document_type='Workshop' and can_workshop and
        (a.created_by=p_actor_id or (actor_role<>'เซลล์' and has_page_permission(p_actor_id,'workshop-approve'))));
 return jsonb_build_object('expenses',expenses,'workshops',workshops,'requests',requests,'archived',archived);
end; $$;
notify pgrst, 'reload schema';
commit;
