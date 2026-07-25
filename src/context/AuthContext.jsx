import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const STORAGE_KEY = 'gocost_session_user'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCurrentUser(JSON.parse(stored))
    } catch {
      // ข้อมูล session เสีย ไม่ต้องพัง แค่ถือว่ายังไม่ login
    } finally {
      setLoading(false)
    }
  }, [])

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
    setCurrentUser(user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return { success: true, user }
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEY)
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
