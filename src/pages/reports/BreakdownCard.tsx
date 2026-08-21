import { Card } from '@/components/ui/Card'
import { RankedList, type RankedListRow } from '@/components/ui/RankedList'

export function BreakdownCard({ title, rows }: { title: string; rows: RankedListRow[] }) {
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      <RankedList rows={rows} />
    </Card>
  )
}
