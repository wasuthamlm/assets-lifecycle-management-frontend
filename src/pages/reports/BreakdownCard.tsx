import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

interface BreakdownRow {
  key: string
  label: string
  count: number
}

export function BreakdownCard({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="truncate text-slate-600 dark:text-slate-300">{row.label}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{row.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-brand-500 transition-all duration-200"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
