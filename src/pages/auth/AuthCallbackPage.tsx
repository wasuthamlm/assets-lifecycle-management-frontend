import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSsoLogin } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { getErrorMessage } from '@/lib/errorMessage'
import { supabase } from '@/lib/supabase'

const SESSION_WAIT_TIMEOUT_MS = 8000

/**
 * หน้าที่ Supabase redirect กลับมาหลัง login ผ่าน Microsoft สำเร็จ (ดู LoginPage.onSsoLogin)
 * supabase-js parse token จาก URL hash แบบ async (detectSessionInUrl ค่า default) — ถ้า parse ยังไม่เสร็จ
 * ตอนที่เรียก getSession() ครั้งแรกจะได้ null ทั้งที่ login จริงสำเร็จ จึงต้องรอ event SIGNED_IN ประกบไว้ด้วย
 * ไม่ใช่เช็ค getSession() ครั้งเดียวแล้วฟันธงว่า fail
 */
export function AuthCallbackPage() {
  const { mutate } = useSsoLogin()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const exchanged = useRef(false)

  useEffect(() => {
    if (!supabase) {
      setErrorMessage('ยังไม่ได้ตั้งค่า Microsoft SSO บนระบบนี้')
      return
    }

    function exchange(accessToken: string) {
      if (exchanged.current) return
      exchanged.current = true
      mutate(
        { accessToken },
        {
          onError: (err) => setErrorMessage(getErrorMessage(err, 'เข้าสู่ระบบด้วย Microsoft SSO ไม่สำเร็จ')),
          // ไม่ต้องใช้ session ของ Supabase ต่ออีกแล้วหลังแลก token เสร็จ — scope 'local' ล้างแค่ในเครื่อง
          // ไม่ยิง network request ให้ต้องกังวลเรื่อง component unmount ไปแล้วตอน navigate สำเร็จ
          onSettled: () => void supabase?.auth.signOut({ scope: 'local' }),
        },
      )
    }

    // เคสส่วนใหญ่: supabase-js parse URL hash เสร็จก่อน effect นี้ทำงานแล้ว มี session พร้อมใช้ทันที
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) exchange(data.session.access_token)
    })

    // เผื่อ parse ยังไม่เสร็จตอน getSession() ข้างบนถูกเรียก — รอ event นี้แทน
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) exchange(session.access_token)
    })

    const timeout = setTimeout(() => {
      if (!exchanged.current) {
        setErrorMessage('ไม่พบข้อมูล session จาก Microsoft กรุณาลองเข้าสู่ระบบใหม่')
      }
    }, SESSION_WAIT_TIMEOUT_MS)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
    // mutate จาก useMutation เป็น reference คงที่ (react-query) ใส่ dep ได้โดยไม่ทำให้ effect นี้ทำงานซ้ำทุก render
  }, [mutate])

  if (errorMessage) {
    return (
      <Card>
        <p className="mb-4 text-sm text-red-600">{errorMessage}</p>
        <Link to="/login" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex flex-col items-center gap-3 py-6 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 size={24} className="animate-spin" />
        กำลังเข้าสู่ระบบด้วย Microsoft...
      </div>
    </Card>
  )
}
