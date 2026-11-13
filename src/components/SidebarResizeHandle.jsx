import { useEffect, useRef, useState } from 'react'
import { SIDEBAR_STORAGE_KEY as STORAGE_KEY, SIDEBAR_MIN as MIN, SIDEBAR_MAX as MAX, SIDEBAR_DEFAULT as DEFAULT, SIDEBAR_COLLAPSED as COLLAPSED, clampSidebarWidth as clamp } from '../lib/sidebarSize'

export default function SidebarResizeHandle({ width, collapsed, onWidthChange, onCollapsedChange }) {
  const drag = useRef(null)
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    if (!dragging) return
    const root = document.documentElement, cursor = root.style.cursor, select = root.style.userSelect
    root.style.cursor = 'col-resize'; root.style.userSelect = 'none'
    return () => { root.style.cursor = cursor; root.style.userSelect = select }
  }, [dragging])
  function persist(value) {
    try { localStorage.setItem(STORAGE_KEY, String(value)) } catch { /* Width persistence is optional. */ }
  }
  function resize(value) {
    const collapse = value < 146
    onCollapsedChange(collapse)
    const next = collapse ? width : clamp(value)
    if (!collapse) onWidthChange(next)
    return next
  }
  function end(event, cancel = false) {
    if (!drag.current) return
    const state = drag.current
    drag.current = null; setDragging(false)
    if (cancel) { onWidthChange(state.originalWidth); onCollapsedChange(state.originalCollapsed) }
    else persist(state.lastWidth)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  function keyboard(event) {
    const current = collapsed ? COLLAPSED : width
    const value = { ArrowLeft: current - 20, ArrowRight: collapsed ? MIN : current + 20, Home: COLLAPSED, End: MAX }[event.key]
    if (value == null && event.key !== 'Enter') return
    event.preventDefault(); event.stopPropagation()
    if (event.key === 'Enter') onCollapsedChange(!collapsed)
    else persist(resize(event.key === 'ArrowLeft' && width === MIN ? COLLAPSED : value))
  }
  return <div className={`sidebar-resizer ${dragging ? 'is-dragging' : ''}`} role="separator" aria-label="ปรับความกว้างเมนู" aria-orientation="vertical" aria-controls="main-navigation" aria-valuemin={COLLAPSED} aria-valuemax={MAX} aria-valuenow={collapsed ? COLLAPSED : width} aria-valuetext={collapsed ? 'พับเมนู 72 พิกเซล' : `${width} พิกเซล`} tabIndex={0}
    title="คลิกค้างแล้วลากปรับความกว้าง · ใช้ปุ่มลูกศรได้ · ดับเบิลคลิกคืนขนาดปกติ"
    onKeyDown={keyboard}
    onDoubleClick={() => { onWidthChange(DEFAULT); onCollapsedChange(false); persist(DEFAULT) }}
    onPointerDown={event => {
      if (event.button !== 0) return
      event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { startX: event.clientX, startWidth: collapsed ? COLLAPSED : width, originalWidth: width, originalCollapsed: collapsed, lastWidth: width }
      setDragging(true)
    }}
    onPointerMove={event => { if (drag.current) drag.current.lastWidth = resize(drag.current.startWidth + event.clientX - drag.current.startX) }}
    onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)} onLostPointerCapture={event => end(event)}><span aria-hidden="true">⋮</span></div>
}
