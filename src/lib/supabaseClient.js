import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://scfaedrjqgxmlfxtlifc.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZmFlZHJqcWd4bWxmeHRsaWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTQ2MTUsImV4cCI6MjA5OTA3MDYxNX0.w1nAVJrCH7bw12taDh6Y2uExp2gGHryrNZgitnTGjQU'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[GoCost] VITE_SUPABASE_URL หรือ VITE_SUPABASE_ANON_KEY ไม่ถูกตั้งใน Environment Variable — ใช้งานค่าเริ่มต้นตามระบบ')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
