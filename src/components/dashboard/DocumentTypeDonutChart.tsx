import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DashboardSummary } from '@/api/types/dashboard.types'

const COLORS = ['#2563eb', '#22c55e']

export function DocumentTypeDonutChart({ summary }: { summary: DashboardSummary }) {
  const { withdraw, borrow } = summary.requisitions.byRequestType
  const total = withdraw + borrow

  const data = [
    { name: 'เบิก', value: withdraw },
    { name: 'ยืม', value: borrow },
  ].filter((d) => d.value > 0)

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">สัดส่วนประเภทเอกสาร</h3>
      {total === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex items-center gap-6">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {data.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {data.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {Math.round((entry.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
