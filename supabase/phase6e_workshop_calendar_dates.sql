-- Extend existing request_details; legacy requests without end_date remain single-day.
-- Does not change existing records, roles, approval flow, or financial amounts.
begin;
set local lock_timeout = '5s';
create or replace function public.check_workshop_date_range()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare ending date; raw text;
begin
 if new.request_details ? 'end_date' then
  raw := new.request_details->>'end_date';
  if raw is null or raw !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
   raise exception 'กรุณาระบุวันสิ้นสุดให้ถูกต้อง';
  end if;
  begin ending := raw::date;
  exception when invalid_datetime_format or datetime_field_overflow then
   raise exception 'กรุณาระบุวันสิ้นสุดให้ถูกต้อง';
  end;
  if not isfinite(ending) or new.planned_date is null or ending < new.planned_date then
   raise exception 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น';
  end if;
 end if;
 return new;
end; $$;
create or replace trigger workshop_date_range_check
before insert or update of planned_date, request_details on public.workshop_plans
for each row execute function public.check_workshop_date_range();
commit;
