import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { Link2, ListChecks, Loader2, MessageCircle, PlusCircle } from 'lucide-react'
import { lineService } from '@/api/services/line.service'
import type { CurrentUser } from '@/api/types/auth.types'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getLiffIdToken, initLiff, reloginLiff } from '@/lib/liff'
import { setPostLoginRedirect } from '@/lib/postLoginRedirect'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'

// ต้องตรงกับ LINE_NOT_LINKED ใน backend (modules/line/line-id-token.guard.ts)
const LINE_NOT_LINKED = 'LINE_NOT_LINKED'

type Session =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-linked'; idToken: string }
  | { status: 'ready'; idToken: string; user: CurrentUser }

interface LiffSession {
  idToken: string
  user: CurrentUser
}

const LiffSessionContext = createContext<LiffSession | null>(null)

/** ใช้ในหน้าลูกของ LiffLayout เท่านั้น — layout render หน้าลูกเฉพาะตอน session พร้อมแล้ว */
export function useLiffSession(): LiffSession {
  const session = useContext(LiffSessionContext)
  if (!session) throw new Error('useLiffSession ต้องอยู่ภายใต้ LiffLayout')
  return session
}

/** ID token หมดอายุ (เปิดหน้าค้างไว้นาน) → login LINE ใหม่เงียบๆ แทนการโชว์ error */
export function handleLiffError(error: unknown, fallback: string) {
  if (error instanceof AxiosError && error.response?.status === 401) {
    reloginLiff()
    return
  }
  toast.error(getErrorMessage(error, fallback))
}

/**
 * เปลือกของหน้า LIFF ที่เปิดจาก rich menu ใน LINE OA — ไม่มี sidebar ออกแบบให้ใช้บนมือถือ
 * 1. init LIFF + เอา ID token  2. ถามว่า LINE นี้ผูกกับพนักงานคนไหน  3. ยังไม่ผูก → หน้า "เชื่อมบัญชี"
 */
export function LiffLayout() {
  const [session, setSession] = useState<Session>({ status: 'loading' })

  const load = useCallback(async () => {
    setSession({ status: 'loading' })
    let idToken: string
    try {
      await initLiff()
      idToken = getLiffIdToken()
    } catch (err) {
      setSession({ status: 'error', message: err instanceof Error ? err.message : 'เปิด LINE ไม่สำเร็จ' })
      return
    }
    try {
      const user = await lineService.me(idToken)
      setSession({ status: 'ready', idToken, user })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) return reloginLiff()
      if (err instanceof AxiosError && err.response?.data?.message === LINE_NOT_LINKED) {
        return setSession({ status: 'not-linked', idToken })
      }
      setSession({ status: 'error', message: getErrorMessage(err, 'โหลดข้อมูลไม่สำเร็จ') })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-[#06C755] px-4 py-3 text-white shadow">
        <MessageCircle size={20} aria-hidden />
        <p className="font-semibold">แจ้งปัญหา IT</p>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-4">
        {session.status === 'loading' && (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {session.status === 'error' && (
          <Card>
            <p className="mb-4 text-sm text-red-600">{session.message}</p>
            <Button variant="secondary" onClick={() => void load()}>
              ลองใหม่
            </Button>
          </Card>
        )}
        {session.status === 'not-linked' && <LinkAccountCard idToken={session.idToken} onLinked={() => void load()} />}
        {session.status === 'ready' && (
          <LiffSessionContext.Provider value={{ idToken: session.idToken, user: session.user }}>
            <LiffTabs />
            <Outlet />
          </LiffSessionContext.Provider>
        )}
      </main>
    </div>
  )
}

function LiffTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm transition-colors',
      isActive ? 'bg-white font-medium text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400',
    )
  return (
    <nav className="mb-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      <NavLink to="/liff/support" end className={tab}>
        <PlusCircle size={16} /> แจ้งปัญหา
      </NavLink>
      <NavLink to="/liff/support/mine" className={tab}>
        <ListChecks size={16} /> เรื่องที่ฉันแจ้ง
      </NavLink>
    </nav>
  )
}

/**
 * ครั้งแรกที่ใช้ — ต้องรู้ว่า LINE นี้คือพนักงานคนไหน จึงให้ login แบบเดียวกับเว็บ (SSO/รหัสผ่าน) แล้วผูก
 * ถ้าในเครื่องนี้ login เว็บค้างอยู่แล้ว ให้ยืนยันชื่อก่อนผูก (กันกรณีเครื่องที่คนอื่นเคย login ไว้)
 */
function LinkAccountCard({ idToken, onLinked }: { idToken: string; onLinked: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const webUser = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clear)
  const [isLinking, setIsLinking] = useState(false)

  function goLogin() {
    clearAuth()
    setPostLoginRedirect(location.pathname)
    navigate('/login')
  }

  async function link() {
    setIsLinking(true)
    try {
      await lineService.link(idToken)
      toast.success('เชื่อมบัญชี LINE เรียบร้อย')
      onLinked()
    } catch (err) {
      toast.error(getErrorMessage(err, 'เชื่อมบัญชีไม่สำเร็จ'))
    } finally {
      setIsLinking(false)
    }
  }

  const name = webUser?.employee?.fullName ?? webUser?.fullName

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#06C755]/10 text-[#05a347]">
          <Link2 size={20} />
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">เชื่อมบัญชีพนักงาน</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">ทำครั้งเดียว ครั้งต่อไปแจ้งปัญหาได้ทันที</p>
        </div>
      </div>

      {accessToken && name ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            เชื่อม LINE นี้กับบัญชี <span className="font-semibold">{name}</span> ใช่หรือไม่?
          </p>
          <Button className="w-full" loading={isLinking} onClick={() => void link()}>
            ใช่ เชื่อมบัญชี
          </Button>
          <Button className="w-full" variant="ghost" onClick={goLogin} disabled={isLinking}>
            ไม่ใช่ฉัน — เข้าสู่ระบบด้วยบัญชีอื่น
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">เข้าสู่ระบบด้วยบัญชีบริษัทเพื่อยืนยันตัวตน แล้วระบบจะพากลับมาหน้านี้</p>
          <Button className="w-full" onClick={goLogin}>
            เข้าสู่ระบบเพื่อเชื่อมบัญชี
          </Button>
        </div>
      )}
    </Card>
  )
}
