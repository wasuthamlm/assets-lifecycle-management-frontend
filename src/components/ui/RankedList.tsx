import { EmptyState } from '@/components/ui/EmptyState'
import { formatNumber } from '@/lib/formatters'

export interface RankedListRow {
  key: string
  label: string
  count: number
}

export function RankedList({ rows }: { rows: RankedListRow[] }) {
  if (rows.length === 0) return <EmptyState />

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 py-2.5">
          <span className="truncate text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {formatNumber(row.count)}
          </span>
        </div>
      ))}
    </div>
  )
}
