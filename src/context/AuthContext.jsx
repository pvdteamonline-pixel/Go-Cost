import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const STORAGE_KEY = 'gocost_session_user'

function storeSession(user) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* A blocked browser store must not prevent login/logout. */ }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const sessionVersion = useRef(0)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const user = stored ? JSON.parse(stored) : null
      if (user?.id) {
        setCurrentUser(user)
        return // Verify cached permissions before rendering any protected page.
      }
    } catch {
      // ข้อมูล session เสีย ไม่ต้องพัง แค่ถือว่ายังไม่ login
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!currentUser?.id) return
    const userId = currentUser.id
    const version = sessionVersion.current
    let active = true, refreshing = false, firstCheck = true
    const valid = () => active && sessionVersion.current === version
    async function refreshPermissions() {
      if (!valid() || refreshing) return
      refreshing = true
      try {
        // Existing table-returning RPC; filter on the server so only this profile is returned.
        const { data, error } = await supabase.rpc('get_users').eq('id', userId).maybeSingle()
        if (error) throw error
        if (!valid()) return
        if (!data) {
          sessionVersion.current += 1
          storeSession(null)
          setCurrentUser(null)
          setLoading(false)
          return
        }
        const updated = {
          id: data.id, role: data.role, name: data.name, full_name: data.full_name,
          email: data.email, page_permissions: Array.isArray(data.page_permissions) ? data.page_permissions : [],
        }
        storeSession(updated)
        setCurrentUser(previous => previous?.id === userId
          ? JSON.stringify(previous) === JSON.stringify(updated) ? previous : updated
          : previous)
      } catch {
        // Never restore old grants from local storage when the initial check fails.
        // Retry on focus/visibility and the next polling interval.
        if (valid() && firstCheck) setCurrentUser(previous => previous?.id === userId
          ? { ...previous, role: null, page_permissions: [] } : previous)
      } finally {
        refreshing = false
        firstCheck = false
        if (valid()) setLoading(false)
      }
    }
    const refreshWhenVisible = () => { if (document.visibilityState !== 'hidden') refreshPermissions() }
    refreshPermissions()
    const interval = setInterval(refreshWhenVisible, 30000)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [currentUser?.id])

  const login = useCallback(async (id, password) => {
    if (!id || !password) {
      return { success: false, message: 'กรุณากรอกรหัสผู้ใช้และรหัสผ่าน' }
    }
    // login_user เป็น RPC (security definer) ที่เทียบรหัสผ่านฝั่ง server เท่านั้น
    // ไม่มีการส่ง password_hash กลับมาที่ client เลย
    const { data, error } = await supabase.rpc('login_user', {
      p_id: id.trim(),
      p_password: password,
    })
    if (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message }
    }
    if (!data || data.length === 0) {
      return { success: false, message: 'รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
    }
    const user = data[0]
    sessionVersion.current += 1
    setCurrentUser(user)
    storeSession(user)
    return { success: true, user }
  }, [])

  const logout = useCallback(() => {
    sessionVersion.current += 1
    setCurrentUser(null)
    setLoading(false)
    storeSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกภายใน <AuthProvider>')
  return ctx
}
