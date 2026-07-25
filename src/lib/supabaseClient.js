import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // ตั้งใจให้ throw ชัดเจนตอน dev แทนที่จะปล่อยให้ error คลุมเครือตอน runtime
  console.error('[GoCost] ขาด VITE_SUPABASE_URL หรือ VITE_SUPABASE_ANON_KEY — ตรวจสอบไฟล์ .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
