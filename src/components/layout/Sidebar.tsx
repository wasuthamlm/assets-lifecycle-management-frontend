import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, FileText } from 'lucide-react'
import { NAV_TOP, NAV_CREATE_GROUP, NAV_GROUPS } from './navConfig'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarUserFooter } from './SidebarUserFooter'
import { usePermission } from '@/hooks/usePermission'
import { useUiStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const { hasPermission } = usePermission()
  const location = useLocation()
  const [createOpen, setCreateOpen] = useState(true)

  const createItems = NAV_CREATE_GROUP.items.filter((i) => !i.permission || hasPermission(i.permission))
  const isCreateActive = createItems.some((i) => location.pathname === i.href)

  return (
    <aside
      className={cn(
        'flex h-screen shrink-0 flex-col bg-navy-900 transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
          <FileText size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">ระบบทรัพย์สิน IT</p>
            <p className="truncate text-xs text-slate-400">IT Asset Lifecycle</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        <SidebarNavItem item={NAV_TOP} collapsed={collapsed} />

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

        {NAV_GROUPS.map((group, idx) => {
          const items = group.items.filter((i) => !i.permission || hasPermission(i.permission))
          if (items.length === 0) return null
          return (
            <div key={idx} className="pt-2">
              <div className="my-2 border-t border-white/10" />
              {items.map((item) => (
                <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          )
        })}
      </nav>

      <SidebarUserFooter collapsed={collapsed} />
    </aside>
  )
}
