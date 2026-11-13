import Icon from './Icon'

export default function DocumentGroupHeader({ label, count, colSpan, open, onToggle, unit = 'เอกสาร' }) {
  return <tr className="document-group-row"><th colSpan={colSpan} scope="rowgroup">
    <button type="button" className="document-group-toggle" aria-expanded={open} onClick={onToggle} aria-label={`${open ? 'พับ' : 'ขยาย'}กลุ่ม ${label}`}>
      <Icon name={open ? 'chevronDown' : 'chevronRight'} size={18} /><span>{label}</span><small>· {count} {unit}</small>
    </button>
  </th></tr>
}
