import { useState } from 'react'
import { Search } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { DateRangePicker, type DateRange } from './DateRangePicker'
import { Breadcrumbs } from './Breadcrumbs'
import { usePageTitleContext } from '@/hooks/usePageTitle'
import { useCommandPaletteStore } from '@/stores/commandPalette.store'

function defaultRange(): DateRange {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from, to: now }
}

export function Topbar() {
  const { title } = usePageTitleContext()
  const [range, setRange] = useState<DateRange>(defaultRange())
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen)

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <Breadcrumbs />
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => openCommandPalette(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-400 transition-colors duration-200 hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:text-slate-300"
        >
          <Search size={14} />
          <span className="hidden lg:inline">ค้นหาหรือไปที่หน้า...</span>
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium dark:border-slate-700 sm:inline">
            Ctrl K
          </kbd>
        </button>
        <DateRangePicker value={range} onChange={setRange} />
        <ThemeToggle />
      </div>
    </header>
  )
}
