import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { PageTitleProvider } from '@/hooks/usePageTitle'

export function AppLayout() {
  const location = useLocation()

  return (
    <PageTitleProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div key={location.pathname} className="animate-fade-slide-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <CommandPalette />
    </PageTitleProvider>
  )
}
