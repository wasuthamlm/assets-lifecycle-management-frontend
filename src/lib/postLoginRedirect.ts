/**
 * จำหน้าที่ต้องกลับไปหลัง login — ใช้กับ flow "เชื่อมบัญชี LINE" ที่หน้า LIFF ส่งผู้ใช้มา login ก่อน
 * เก็บใน sessionStorage เพราะ SSO (Microsoft ผ่าน Supabase) redirect ออกนอกแอปแล้วค่อยกลับมาที่ /auth/callback
 * รับเฉพาะ path ภายใต้ /liff/ — กัน open redirect
 */
const KEY = 'post-login-redirect'

export function setPostLoginRedirect(path: string) {
  try {
    if (path.startsWith('/liff/')) sessionStorage.setItem(KEY, path)
  } catch {
    // sessionStorage ใช้ไม่ได้ (private mode บางเครื่อง) — หลัง login ก็แค่ไปหน้าปกติ
  }
}

export function takePostLoginRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return path?.startsWith('/liff/') ? path : null
  } catch {
    return null
  }
}
