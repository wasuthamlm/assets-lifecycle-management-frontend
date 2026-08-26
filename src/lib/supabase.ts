import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// ใช้เฉพาะสำหรับ Microsoft SSO login (OAuth redirect + session ชั่วคราวระหว่าง redirect) —
// ไม่ใช่ auth หลักของระบบ (นั่นคือ TokenPair ของ backend เก็บใน authStore) จึงไม่ต้อง auto-refresh
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: true } })
    : null

export const isSsoConfigured = !!supabase
