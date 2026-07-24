import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DashboardByPerson } from '@/api/types/dashboard.types'

export function RequisitionByPersonCard({ data }: { data: DashboardByPerson[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">สัดส่วนการเบิกของแต่ละคนในทีม</h3>
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {data.map((person) => (
            <div key={person.employeeId}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="truncate text-slate-600 dark:text-slate-300">{person.fullName}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{person.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-brand-500 transition-all duration-200"
                  style={{ width: `${(person.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
