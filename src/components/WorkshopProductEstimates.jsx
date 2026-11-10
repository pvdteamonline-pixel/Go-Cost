import { useState } from 'react'
import { PRODUCT_ESTIMATES, formatMoney, validMoney } from '../lib/workshopRequest'

function EstimateInput({ field, value, onChange }) {
  const [displayValue, setDisplayValue] = useState(() => validMoney(value) ? formatMoney(value) : value ?? '')
  return <label className={'wr-estimate-card ' + field.tone}>
    <span>{field.label}</span>
    <span className="wr-estimate-input">
      <input aria-label={field.label} type="text" inputMode="decimal" maxLength={16}
        value={displayValue} placeholder="ยังไม่ระบุ"
        onBlur={() => { if (validMoney(value)) setDisplayValue(formatMoney(value)) }}
        onChange={e => {
          setDisplayValue(e.target.value)
          onChange(field.key, e.target.value.replaceAll(',', ''))
        }} />
      <span aria-hidden="true">บาท</span>
    </span>
  </label>
}

export default function WorkshopProductEstimates({ values, onChange }) {
  return <div className="wr-product-estimates wr-full" role="group" aria-label="ประมาณการสินค้า">
    {PRODUCT_ESTIMATES.map(field => onChange
      ? <EstimateInput key={field.key} field={field} value={values?.[field.key]} onChange={onChange} />
      : <div key={field.key} className={'wr-estimate-card ' + field.tone}>
        <div className="wr-estimate-label">{field.label}</div>
        <p className="wr-estimate-value">{values?.[field.key] == null || values[field.key] === ''
          ? <span className="wr-estimate-empty">ยังไม่ระบุ</span>
          : <>{formatMoney(values[field.key])}<span>บาท</span></>}</p>
      </div>)}
  </div>
}
