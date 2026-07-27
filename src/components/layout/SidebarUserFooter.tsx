import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useLogoutFlow } from '@/hooks/useLogoutFlow'

export function SidebarUserFooter({ collapsed }: { collapsed: boolean }) {
  const user = useAuthStore((s) => s.user)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { handleLogout, modal } = useLogoutFlow()

  const displayName = user?.employee?.fullName ?? user?.username ?? '...'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="border-t border-white/10 px-2 py-3">
      <div className="flex items-center gap-3 rounded-lg px-1 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {initial}
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-medium text-slate-100">{displayName}</span>
        )}
      </div>

      <button
        onClick={toggleSidebar}
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && <span>ย่อเมนู</span>}
      </button>

      <button
        onClick={handleLogout}
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
      >
        <LogOut size={16} />
        {!collapsed && <span>ออกจากระบบ</span>}
      </button>
      {modal}
    </div>
  )
}
