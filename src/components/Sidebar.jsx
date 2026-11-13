import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { NAV_GROUPS } from '../lib/constants'
import { hasPagePermission } from '../lib/permissions'
import Icon from './Icon'
import DataStatusBox from './DataStatusBox'

export default function Sidebar({ active, onNavigate, collapsed, onToggle, mobile, onClose }) {
  const { currentUser, logout } = useAuth()
  const [expanded, setExpanded] = useState({})
  const panel = useRef(null)
  const profile = useRef(null)
  const groups = NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(item => hasPagePermission(currentUser, item.key)) })).filter(group => group.items.length)
  const name = currentUser?.full_name || currentUser?.name || 'ผู้ใช้งาน'
  const role = currentUser?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : currentUser?.role
  useEffect(() => {
    const group = NAV_GROUPS.find(group => group.items.some(item => item.key === active))
    if (group) setExpanded(previous => ({ ...previous, [group.label]: true }))
  }, [active])
  useEffect(() => {
    if (!mobile || collapsed) return
    const previous = document.activeElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector('.sidebar-toggle')?.focus()
    return () => { document.body.style.overflow = oldOverflow; if (previous?.isConnected) requestAnimationFrame(() => previous.focus()) }
  }, [mobile, collapsed])
  useEffect(() => {
    const close = event => { if (!profile.current?.contains(event.target)) profile.current?.removeAttribute('open') }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  function handleKeys(event) {
    if (event.key === 'Escape') {
      if (profile.current?.open) { profile.current.open = false; profile.current.querySelector('summary').focus(); event.stopPropagation() }
      else if (mobile) { event.preventDefault(); onClose() }
    }
    if (event.key !== 'Tab' || !mobile || collapsed) return
    const targets = [...panel.current.querySelectorAll('button, summary, a, select, input')].filter(node => !node.disabled && node.getClientRects().length)
    const first = targets[0], last = targets.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  return <aside ref={panel} id="main-navigation" className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`} role={mobile && !collapsed ? 'dialog' : undefined} aria-modal={mobile && !collapsed ? true : undefined} aria-label="เมนูหลัก" inert={mobile && collapsed} onKeyDown={handleKeys}>
    <div className="sidebar-brand"><span className="sidebar-brand-copy">GoCost</span><button className="icon-button sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'เปิดเมนู' : mobile ? 'ปิดเมนู' : 'พับเมนู'} title={collapsed ? 'เปิดเมนู' : 'พับเมนู'} aria-expanded={!collapsed} aria-controls="main-navigation"><Icon name={collapsed ? 'menu' : mobile ? 'close' : 'collapse'} size={20} /></button></div>
    <nav className="sidebar-nav" aria-label="หมวดงาน">
      {groups.map((group, index) => {
        const open = expanded[group.label] ?? index < 3
        return <section className="sidebar-group" key={group.label}>
          {!collapsed && <button className="sidebar-group-title" aria-expanded={open} onClick={() => setExpanded(previous => ({ ...previous, [group.label]: !open }))}><span>{group.label}</span><Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} /></button>}
          {(collapsed || open) && <div className="sidebar-group-items">{group.items.map(item => <button key={item.key} className={`sidebar-link ${active === item.key ? 'is-active' : ''}`} onClick={() => onNavigate(item.key)} aria-current={active === item.key ? 'page' : undefined} aria-label={item.label} title={item.label}><Icon name={item.icon} size={20} /><span className="sidebar-label">{item.label}</span></button>)}</div>}
        </section>
      })}
    </nav>
    <div className="sidebar-footer"><details className="sidebar-profile" ref={profile}>
      <summary aria-label={`บัญชีผู้ใช้ ${name}`}><span className="profile-avatar">{Array.from(name)[0]}</span><span className="profile-copy"><strong>{name}</strong><small>{role}</small></span><span className="profile-chevron"><Icon name="chevronDown" size={16} /></span></summary>
      <div className="profile-menu"><p>{name} · {role}</p><DataStatusBox /><button className="profile-logout" onClick={logout}><Icon name="logout" size={16} />ออกจากระบบ</button></div>
    </details></div>
  </aside>
}
