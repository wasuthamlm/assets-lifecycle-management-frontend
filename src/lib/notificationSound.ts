// สังเคราะห์เสียง "ติ้ง" สั้น ๆ ด้วย Web Audio API แทนที่จะฝังไฟล์เสียงจริง — เบา ไม่ต้องโหลดไฟล์เพิ่ม
// และปรับ pitch/ความยาวได้ง่ายกว่าไฟล์ static
let sharedContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!sharedContext) sharedContext = new Ctor()
  return sharedContext
}

// AudioContext ใหม่ทุกตัวเกิดมาเป็น 'suspended' จนกว่าจะมี user gesture มา resume — event แจ้งเตือนที่มาทาง SSE
// ไม่ใช่ user gesture เอง ถ้า resume() แล้วไม่รอให้เสร็จก่อนจะ schedule เสียงต่อ (เดิม `void ctx.resume()` ไม่ await)
// เสียงจะถูก schedule ทับไปตอน context ยังไม่ตื่นจริง แล้วหายไปเงียบ ๆ ไม่มี error ให้เห็นเลย — นี่คือสาเหตุที่ไม่ได้ยินเสียง
// แก้โดย await resume() ให้เสร็จก่อนเสมอค่อยคำนวณเวลา/เล่นเสียง
async function ensureRunning(ctx: AudioContext) {
  if (ctx.state === 'suspended') await ctx.resume()
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, peakGain: number) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  // envelope สั้น ๆ กันเสียง "click" ตอนเริ่ม/จบเสียงกะทันหัน (ramp ขึ้นเร็ว แล้วลดลงแบบ exponential)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

/** เสียงแจ้งเตือนสั้น ๆ 2 โน้ต (คล้าย messenger ทั่วไป) — เรียกได้บ่อยเท่าที่ต้องการ ไม่มีผลข้างเคียงถ้าเล่นไม่ได้ */
export async function playNotificationSound() {
  try {
    const ctx = getContext()
    if (!ctx) return
    await ensureRunning(ctx)
    const now = ctx.currentTime
    playTone(ctx, 880, now, 0.14, 0.18)
    playTone(ctx, 1318.5, now + 0.09, 0.16, 0.15)
  } catch (err) {
    // เสียงเป็นแค่ของเสริม ห้ามให้ error ตรงนี้ไปกระทบ flow แจ้งเตือนหลัก (toast/badge ต้องอัปเดตต่อได้ปกติ)
    // แต่ log ไว้เผื่อ debug — เงียบสนิทแบบเดิมทำให้หาสาเหตุเสียงไม่ออกไม่เจอเลย
    console.warn('[notificationSound] เล่นเสียงแจ้งเตือนไม่สำเร็จ:', err)
  }
}

// เผื่อ resume() แบบ async ข้างบนยังไม่ทันเสร็จตอนแจ้งเตือนแรกมาถึง (เช่น browser เข้มงวดเรื่อง user gesture
// มากกว่าปกติ) — ดัก user gesture แรกสุดของ session มา warm-up context ไว้ล่วงหน้าเลย กันพลาดรอบแรก
function primeOnFirstInteraction() {
  if (typeof window === 'undefined') return
  const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown']
  function unlock() {
    const ctx = getContext()
    if (ctx?.state === 'suspended') void ctx.resume()
    events.forEach((e) => window.removeEventListener(e, unlock))
  }
  events.forEach((e) => window.addEventListener(e, unlock, { once: true }))
}

primeOnFirstInteraction()
