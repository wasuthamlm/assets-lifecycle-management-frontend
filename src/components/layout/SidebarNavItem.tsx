import { NavLink } from 'react-router-dom'
import type { NavItem } from './navConfig'
import { cn } from '@/lib/utils'

export function SidebarNavItem({ item, collapsed, badgeCount }: { item: NavItem; collapsed: boolean; badgeCount?: number }) {
  const Icon = item.icon
  const showBadge = !!badgeCount && badgeCount > 0

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-out',
          isActive
            ? 'bg-brand-500/90 text-white shadow-sm'
            : 'text-slate-300 hover:translate-x-0.5 hover:bg-white/5 hover:text-white',
        )
      }
    >
      <span className="relative shrink-0">
        <Icon size={18} />
        {showBadge && collapsed && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-navy-900" />
        )}
      </span>
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && showBadge && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
          {badgeCount}
        </span>
      )}
    </NavLink>
  )
}
