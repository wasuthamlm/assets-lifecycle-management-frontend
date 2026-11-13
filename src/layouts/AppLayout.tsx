import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { PendingPermissionsPlaceholder } from '@/components/layout/PendingPermissionsPlaceholder'
import { PageTitleProvider } from '@/hooks/usePageTitle'
import { useNotificationsStream } from '@/hooks/useNotifications'
import { useAuthStore } from '@/stores/auth.store'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  useNotificationsStream()

  // เมนูแบบ drawer สำหรับจอเล็กกว่า lg — เก็บเป็น state ในหน้า (ไม่ใส่ ui.store เพราะ store นั้น persist
  // ลง localStorage จะทำให้ reload แล้วเมนูเปิดค้าง)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // เปลี่ยนหน้าแล้วปิด drawer อัตโนมัติ
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileNavOpen])

  // user ผูก employee แล้วแต่ admin ยังไม่ได้กำหนด role ให้ (permissions ว่างเปล่า) — โชว์ placeholder
  // แทน Outlet ตรงๆ เลย ไม่เปลี่ยน route/URL เพื่อให้ sidebar/topbar ยังใช้งานได้ปกติ
  const pendingPermissions = !!user && !!user.employeeId && user.permissions.length === 0

  return (
    <PageTitleProvider>
      <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div
          aria-hidden
          onClick={() => setMobileNavOpen(false)}
          className={cn(
            'fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
            mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div key={location.pathname} className="animate-fade-slide-in">
              <ErrorBoundary variant="inline">
                {pendingPermissions ? <PendingPermissionsPlaceholder /> : <Outlet />}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </PageTitleProvider>
  )
}
