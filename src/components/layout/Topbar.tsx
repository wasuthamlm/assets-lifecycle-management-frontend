import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { DateRangePicker, type DateRange } from './DateRangePicker'
import { usePageTitleContext } from '@/hooks/usePageTitle'

function defaultRange(): DateRange {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from, to: now }
}

export function Topbar() {
  const { title } = usePageTitleContext()
  const [range, setRange] = useState<DateRange>(defaultRange())

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
      <div className="flex items-center gap-3">
        <DateRangePicker value={range} onChange={setRange} />
        <ThemeToggle />
      </div>
    </header>
  )
}
