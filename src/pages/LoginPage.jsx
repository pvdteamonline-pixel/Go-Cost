import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function LoginPage() {
  const { login } = useAuth()
  const [id, setId] = useState(''), [password, setPassword] = useState('')
  const [error, setError] = useState(''), [submitting, setSubmitting] = useState(false)
  const [showPassword,setShowPassword]=useState(false), [capsLock,setCapsLock]=useState(false)
  async function handleSubmit(e) {
    e.preventDefault()
    if(submitting)return
    setError('');setSubmitting(true)
    try {const result=await login(id,password);if(!result.success)setError(result.message)}
    catch {setError('เชื่อมต่อไม่สำเร็จ กรุณาลองเข้าสู่ระบบอีกครั้ง')}
    finally {setSubmitting(false)}
  }
  return <main className="login-scene">
    <section className="login-story" aria-label="GoCost">
      <div className="login-brand"><img src="/logo.png" alt="โลโก้บริษัท"/><div><p className="brand-shimmer">GoCost</p><span>WORKSPACE</span></div></div>
      <div className="login-message"><h1>ทุกค่าใช้จ่าย<br/><span>ชัดเจนในที่เดียว</span></h1><p>จัดการค่าใช้จ่าย ติดตามเอกสาร<br/>และวางแผนงานขององค์กร</p>
        <div className="login-features">{[['cash','ค่าใช้จ่าย'],['chart','รายงาน'],['calendar','Workshop']].map(([icon,label])=><div key={label}><span><Icon name={icon}/></span><p>{label}</p></div>)}</div>
      </div>
      <div className="login-glass-art" aria-hidden="true"><i/><i/><i/><i/></div>
      <p className="login-story-footer">GoCost · ระบบวางแผนและติดตามงบการตลาด</p>
    </section>
    <section className="login-form-side">
      <form onSubmit={handleSubmit} className="login-card" aria-label="เข้าสู่ระบบ GoCost">
        <div className="login-company-logo"><img src="/logo.png" alt="โลโก้บริษัท พรรณวดี" width="1000" height="600" /></div>
        <span className="brand-shimmer login-card-brand">GoCost</span>
        <h2>ยินดีต้อนรับกลับ</h2><p className="login-card-description">เข้าสู่ระบบเพื่อจัดการค่าใช้จ่ายของคุณ</p>
        <div className="login-field"><label htmlFor="login-user">รหัสผู้ใช้งาน</label><input id="login-user" className="glass-input" value={id} onChange={e=>setId(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="กรอกรหัสผู้ใช้งาน" required disabled={submitting}/></div>
        <div className="login-field"><label htmlFor="login-password">รหัสผ่าน</label><div className="login-password"><input id="login-password" className="glass-input" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="กรอกรหัสผ่าน" required disabled={submitting} onKeyUp={e=>setCapsLock(e.getModifierState('CapsLock'))} onBlur={()=>setCapsLock(false)} aria-describedby={capsLock?'caps-lock-note':undefined}/><button type="button" aria-label={showPassword?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน'} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{showPassword&&<path d="m3 3 18 18"/>}</svg></button></div>{capsLock&&<p id="caps-lock-note" className="text-xs text-amber-700">Caps Lock เปิดอยู่</p>}</div>
        {error&&<p role="alert" className="login-error">{error}</p>}
        <button type="submit" disabled={submitting} className="login-submit">{submitting?<><span className="login-spinner"/>กำลังเข้าสู่ระบบ…</>:<>เข้าสู่ระบบ <span aria-hidden="true">→</span></>}</button>
        <p className="login-card-footer">สำหรับบุคลากรภายในองค์กร</p>
      </form>
    </section>
  </main>
}
