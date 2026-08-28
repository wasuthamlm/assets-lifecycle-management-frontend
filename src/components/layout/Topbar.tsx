import { ThemeToggle } from './ThemeToggle'
import { Breadcrumbs } from './Breadcrumbs'
import { NotificationBell } from './NotificationBell'
import { usePageTitleContext } from '@/hooks/usePageTitle'

export function Topbar() {
  const { title } = usePageTitleContext()

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <Breadcrumbs />
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  )
}
