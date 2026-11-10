-- Apply after phase6c. Extends validation only; no historical values or financial totals change.
begin;
set local lock_timeout = '5s';
create or replace function public.validate_workshop_details(p_details jsonb)
returns void language plpgsql set search_path=public,pg_temp as $$
declare item jsonb; total numeric:=0; budget numeric; field text;
begin
 if jsonb_typeof(p_details) is distinct from 'object' then raise exception 'ข้อมูลคำขอไม่ถูกต้อง'; end if;
 if coalesce(p_details->>'event_type','') not in ('Workshop','ตั้งกอง','Training Partner','Training ศูนย์ฝึกอาชีพ') then raise exception 'กรุณาเลือกประเภทงาน'; end if;
 if length(trim(coalesce(p_details->>'party_name',''))) not between 1 and 300 then raise exception 'กรุณาระบุชื่อร้าน / ลูกค้า / สถาบัน ไม่เกิน 300 ตัวอักษร'; end if;
 if coalesce(p_details->>'start_time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or coalesce(p_details->>'end_time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or p_details->>'end_time' <= p_details->>'start_time' then raise exception 'เวลาสิ้นสุดต้องหลังเวลาเริ่มในวันเดียวกัน'; end if;
 if length(trim(coalesce(p_details->>'venue',''))) not between 1 and 1000 then raise exception 'กรุณาระบุสถานที่จัด'; end if;
 if length(trim(coalesce(p_details->>'topic',''))) not between 1 and 1000 then raise exception 'กรุณาระบุหัวข้ออบรม'; end if;
 if coalesce(p_details->>'expected_attendees','') !~ '^[0-9]{1,7}$' then raise exception 'จำนวนคนต้องเป็นจำนวนเต็ม'; end if;
 if (p_details->>'expected_attendees')::numeric not between 1 and 1000000 then raise exception 'จำนวนคนต้องอยู่ระหว่าง 1 ถึง 1,000,000'; end if;
 if coalesce(p_details->>'estimated_cost','') !~ '^[0-9]{1,9}([.][0-9]{1,2})?$' then raise exception 'ค่าใช้จ่ายต้องไม่ติดลบและมีทศนิยมไม่เกิน 2 ตำแหน่ง'; end if;
 -- Optional for older clients/records; an explicit zero is different from unknown.
 foreach field in array array['expected_product_order_value','estimated_store_stock_value'] loop
  if p_details ? field and p_details->field <> 'null'::jsonb then
   if jsonb_typeof(p_details->field) not in ('number','string')
    or (p_details->>field) !~ '^[0-9]{1,9}([.][0-9]{1,2})?$'
   then raise exception 'ยอดประมาณการสินค้าต้องอยู่ระหว่าง 0 ถึง 999,999,999.99 บาท และทศนิยมไม่เกิน 2 ตำแหน่ง (%)', field; end if;
  end if;
 end loop;
 budget:=(p_details->>'estimated_cost')::numeric;
 if jsonb_typeof(p_details->'expense_items') is distinct from 'array' then raise exception 'รายการค่าเบิกไม่ถูกต้อง'; end if;
 if jsonb_array_length(p_details->'expense_items')>100 then raise exception 'รายการค่าเบิกเกิน 100 รายการ'; end if;
 for item in select * from jsonb_array_elements(p_details->'expense_items') loop
  if jsonb_typeof(item) is distinct from 'object' or length(trim(coalesce(item->>'description',''))) not between 1 and 500 then raise exception 'กรุณาระบุชื่อรายการค่าเบิก'; end if;
  if coalesce(item->>'amount','') !~ '^[0-9]{1,9}([.][0-9]{1,2})?$' then raise exception 'จำนวนเงินค่าเบิกไม่ถูกต้อง'; end if;
  if (item->>'amount')::numeric<=0 then raise exception 'จำนวนเงินค่าเบิกต้องมากกว่า 0'; end if;
  total:=total+(item->>'amount')::numeric;
 end loop;
 if total>budget then raise exception 'ยอดรวมที่ขอเบิกต้องไม่เกินค่าใช้จ่ายที่คาดการณ์ในข้อ 6'; end if;
 if length(coalesce(p_details->>'equipment',''))>2000 then raise exception 'รายละเอียดอุปกรณ์เกิน 2,000 ตัวอักษร'; end if;
end; $$;


notify pgrst, 'reload schema';
commit;
