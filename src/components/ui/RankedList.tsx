import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatNumber } from '@/lib/formatters'

export interface RankedListRow {
  key: string
  label: string
  count: number
}

export function RankedList({ rows }: { rows: RankedListRow[] }) {
  const [animated, setAnimated] = useState(false)

  // เริ่ม transition หลัง mount เฟรมนึง ไม่งั้น browser จะ paint ที่ width ปลายทางไปเลยตั้งแต่เฟรมแรก
  // จนไม่มี transition ให้เห็น (className เดียวกันไม่ trigger reflow ระหว่าง state เปลี่ยนพร้อมกับ initial paint)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  if (rows.length === 0) return <EmptyState />

  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.map((row) => {
        const pct = Math.round((row.count / max) * 100)
        return (
          <div key={row.key} className="relative overflow-hidden py-2.5">
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-r-md bg-brand-50 transition-[width] duration-700 ease-out dark:bg-brand-500/10"
              style={{ width: animated ? `${pct}%` : '0%' }}
            />
            <div className="relative flex items-center justify-between gap-4">
              <span className="truncate text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {formatNumber(row.count)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
