import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, FileText, X } from 'lucide-react'
import { NAV_TOP, NAV_CREATE_GROUP, NAV_GROUPS } from './navConfig'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarUserFooter } from './SidebarUserFooter'
import { usePermission } from '@/hooks/usePermission'
import { usePendingApprovals } from '@/hooks/usePendingApprovals'
import { useSupportTicketsQuery } from '@/hooks/useSupportTickets'
import { TicketStatus } from '@/api/types/common.types'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'
import type { NavItem } from './navConfig'

const EMPTY_ROLES: string[] = []

interface SidebarProps {
  /** จอเล็กกว่า lg: sidebar เป็น drawer เลื่อนเข้ามาจากซ้าย */
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const storedCollapsed = useUiStore((s) => s.sidebarCollapsed)
  // ตอนเปิดเป็น drawer บนมือถือ ให้แสดงเต็มเสมอ ไม่สนสถานะย่อเมนูที่บันทึกไว้
  const collapsed = storedCollapsed && !mobileOpen
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()
  const roles = useAuthStore((s) => s.user?.roles ?? EMPTY_ROLES)
  const location = useLocation()
  const [createOpen, setCreateOpen] = useState(true)
  const { pendingForMe } = usePendingApprovals()
  // ticket ที่ยังไม่มีใครรับงาน — แสดงเฉพาะคนทำ support (ticket.manage) hr ดูได้แต่ไม่ได้เป็นคนรับงานจึงไม่ต้องเห็นตัวเลข
  // query key เดียวกับตัวนับใน SupportTabs (แชร์ cache) และอัปเดตสดผ่าน SSE "change" ของ topic support_ticket
  const { data: openTickets } = useSupportTicketsQuery({ status: TicketStatus.OPEN, limit: 1 }, hasPermission('ticket.manage'))

  const badgeCounts: Record<string, number | undefined> = {
    '/approvals': pendingForMe.length,
    '/support-tickets': openTickets?.total,
  }

  function isVisible(item: NavItem) {
    if (item.permission) {
      const allowed = Array.isArray(item.permission)
        ? item.permissionMode === 'all'
          ? hasAllPermissions(item.permission)
          : hasAnyPermission(item.permission)
        : hasPermission(item.permission)
      if (!allowed) return false
    }
    if (item.excludeRoles?.some((r) => roles.includes(r))) return false
    return true
  }

  const createItems = NAV_CREATE_GROUP.items.filter(isVisible)
  const isCreateActive = createItems.some((i) => location.pathname === i.href)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-dvh w-72 max-w-[85vw] shrink-0 flex-col bg-navy-900 shadow-2xl transition-[width,transform] duration-200 ease-out',
        'lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'lg:w-[76px]' : 'lg:w-64',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
          <FileText size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            {/* ชื่อไทยยาวเกินบรรทัดเดียวของ sidebar w-64 — ให้ขึ้น 2 บรรทัดแทนการตัดท้ายเป็น ... */}
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">ทรัพย์สิน และ แจ้งปัญหา IT</p>
            <p className="truncate text-xs text-slate-400">IT Asset &amp; Support</p>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดเมนู"
          className="ml-auto shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {isVisible(NAV_TOP) && <SidebarNavItem item={NAV_TOP} collapsed={collapsed} />}

        {createItems.length > 0 && (
          <div>
            <button
              onClick={() => setCreateOpen((v) => !v)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                isCreateActive ? 'bg-white/5 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <NAV_CREATE_GROUP.icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">{NAV_CREATE_GROUP.label}</span>
                  <ChevronDown size={14} className={cn('transition-transform duration-200', createOpen && 'rotate-180')} />
                </>
              )}
            </button>
            {!collapsed && (
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-in-out',
                  createOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                    {createItems.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            'block truncate rounded-lg px-3 py-2 text-sm transition-colors duration-200',
                            isActive ? 'text-brand-300' : 'text-slate-400 hover:text-white',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(isVisible)
          if (items.length === 0) return null
          return (
            <div key={group.label} className="pt-2">
              {collapsed ? (
                <div className="my-2 border-t border-white/10" />
              ) : (
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
              )}
              {items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  badgeCount={badgeCounts[item.href]}
                />
              ))}
            </div>
          )
        })}
      </nav>

      <SidebarUserFooter collapsed={collapsed} />
    </aside>
  )
}
