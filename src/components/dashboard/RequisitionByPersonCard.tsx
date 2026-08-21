import { Card } from '@/components/ui/Card'
import { RankedList } from '@/components/ui/RankedList'
import type { DashboardByPerson } from '@/api/types/dashboard.types'

export function RequisitionByPersonCard({ data }: { data: DashboardByPerson[] }) {
  const rows = data.map((person) => ({ key: String(person.employeeId), label: person.fullName, count: person.count }))

  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">สัดส่วนการเบิกของแต่ละคนในทีม</h3>
      <RankedList rows={rows} />
    </Card>
  )
}
