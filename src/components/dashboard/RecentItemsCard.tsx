import { Link } from 'react-router-dom'
import { ClipboardList, Boxes } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatThaiDate } from '@/lib/formatters'
import type { DashboardRecentActivity } from '@/api/types/dashboard.types'

function itemHref(item: DashboardRecentActivity) {
  return item.type === 'requisition' ? `/requisitions/${item.id}` : `/assets/${item.id}`
}

export function RecentItemsCard({ items }: { items: DashboardRecentActivity[] }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">รายการล่าสุดในระบบ</h3>
        <Link to="/requisitions">
          <Button variant="secondary" size="sm">
            ดูทั้งหมด
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {items.map((item) => {
            const Icon = item.type === 'requisition' ? ClipboardList : Boxes
            return (
              <Link
                key={`${item.type}-${item.id}`}
                to={itemHref(item)}
                className="flex items-center gap-3 py-3 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{item.title}</p>
                  {item.subtitle && <p className="truncate text-xs text-slate-400">{item.subtitle}</p>}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{formatThaiDate(item.createdAt)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
