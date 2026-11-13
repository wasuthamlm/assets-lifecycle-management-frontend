import liff from '@line/liff'
import { lineService } from '@/api/services/line.service'

let initPromise: Promise<void> | null = null

/**
 * init LIFF ครั้งเดียวต่อการโหลดหน้า — liffId มาจาก backend (GET /line/config) จะได้ไม่ต้อง build frontend ใหม่ตอนเปลี่ยน channel
 * เปิดนอกแอป LINE (เช่น browser บนคอม) แล้วยังไม่ login LINE → liff.login() พาไปหน้า login ของ LINE แล้วกลับมาหน้าเดิม
 */
export function initLiff(): Promise<void> {
  initPromise ??= (async () => {
    const config = await lineService.config()
    if (!config.enabled || !config.liffId) throw new Error('ระบบยังไม่ได้เปิดใช้งานการแจ้งปัญหาผ่าน LINE')
    await liff.init({ liffId: config.liffId })
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href })
      // หน้ากำลังถูก redirect — ค้างไว้ไม่ให้โค้ดถัดไปทำงานต่อ
      await new Promise(() => {})
    }
  })().catch((err) => {
    initPromise = null
    throw err
  })
  return initPromise
}

/** ID token ปัจจุบันของ LIFF — backend ใช้ verify ตัวตน (header X-Line-Id-Token) */
export function getLiffIdToken(): string {
  const token = liff.getIDToken()
  if (!token) throw new Error('ไม่พบ LINE ID token — ตรวจว่า LIFF app เปิด scope openid แล้ว')
  return token
}

/**
 * ID token มีอายุจำกัด ถ้าเปิดหน้าค้างไว้นานแล้ว backend ตอบ 401 → logout แล้ว login LINE ใหม่เพื่อได้ token ใหม่
 */
export function reloginLiff() {
  liff.logout()
  liff.login({ redirectUri: window.location.href })
}

export function closeLiff() {
  if (liff.isInClient()) liff.closeWindow()
}

export { liff }
