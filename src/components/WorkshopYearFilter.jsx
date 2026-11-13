export default function WorkshopYearFilter({ years, value, onChange }) {
  return <label className="whc-period-filter"><span>ปีจัดงาน</span><select aria-label="กรองปีจัดงาน" value={value} onChange={event => onChange(event.target.value)}>
    <option value="">ทุกปี</option>
    {value && !years.some(year => year.key === value) && <option value={value}>{value === 'unknown' ? 'ไม่ระบุปี' : `พ.ศ. ${Number(value) + 543}`}</option>}
    {years.map(year => <option key={year.key} value={year.key}>{year.label}</option>)}
  </select></label>
}
