import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { PendingPermissionsPlaceholder } from '@/components/layout/PendingPermissionsPlaceholder'
import { PageTitleProvider } from '@/hooks/usePageTitle'
import { useNotificationsStream } from '@/hooks/useNotifications'
import { useAuthStore } from '@/stores/auth.store'

export function AppLayout() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  useNotificationsStream()

  // user ผูก employee แล้วแต่ admin ยังไม่ได้กำหนด role ให้ (permissions ว่างเปล่า) — โชว์ placeholder
  // แทน Outlet ตรงๆ เลย ไม่เปลี่ยน route/URL เพื่อให้ sidebar/topbar ยังใช้งานได้ปกติ
  const pendingPermissions = !!user && !!user.employeeId && user.permissions.length === 0

  return (
    <PageTitleProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div key={location.pathname} className="animate-fade-slide-in">
              {pendingPermissions ? <PendingPermissionsPlaceholder /> : <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </PageTitleProvider>
  )
}
