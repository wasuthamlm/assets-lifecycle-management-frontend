import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { formatThaiDateRange } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

function toInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

const EXIT_DURATION_MS = 150

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      return
    }
    const timeout = setTimeout(() => setVisible(false), EXIT_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [open])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800',
        )}
      >
        <Calendar size={16} className="text-slate-400" />
        <span>{formatThaiDateRange(value.from, value.to)}</span>
      </button>

      {visible && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-4 shadow-card-hover dark:border-slate-800 dark:bg-slate-900 ${
              open ? 'animate-slide-down' : 'animate-slide-up'
            }`}
          >
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={toInputValue(value.from)}
              onChange={(e) => onChange({ ...value, from: new Date(e.target.value) })}
              className="mb-3 h-9 w-full rounded-xl border border-slate-200 px-2 text-sm transition-colors focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">ถึงวันที่</label>
            <input
              type="date"
              value={toInputValue(value.to)}
              onChange={(e) => onChange({ ...value, to: new Date(e.target.value) })}
              className="h-9 w-full rounded-xl border border-slate-200 px-2 text-sm transition-colors focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </>
      )}
    </div>
  )
}
