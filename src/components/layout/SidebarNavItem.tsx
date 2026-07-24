import { NavLink } from 'react-router-dom'
import type { NavItem } from './navConfig'
import { cn } from '@/lib/utils'

export function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon

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
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}
