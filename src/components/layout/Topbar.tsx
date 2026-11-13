import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Breadcrumbs } from './Breadcrumbs'
import { NotificationBell } from './NotificationBell'
import { AccountMenu } from './AccountMenu'
import { usePageTitleContext } from '@/hooks/usePageTitle'

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { title } = usePageTitleContext()

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="เปิดเมนู"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-200 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <div className="hidden sm:block">
            <Breadcrumbs />
          </div>
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 sm:text-lg">{title}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBell />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  )
}
