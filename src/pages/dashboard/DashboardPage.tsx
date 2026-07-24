import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { usePageTitle } from '@/hooks/usePageTitle'
import { StatCardsRow } from '@/components/dashboard/StatCardsRow'
import { RequisitionByPersonCard } from '@/components/dashboard/RequisitionByPersonCard'
import { DocumentTypeDonutChart } from '@/components/dashboard/DocumentTypeDonutChart'
import { RecentItemsCard } from '@/components/dashboard/RecentItemsCard'
import { Spinner } from '@/components/ui/Spinner'

export function DashboardPage() {
  usePageTitle('แดชบอร์ด')
  const { data: summary, isLoading } = useDashboardSummary()

  if (isLoading || !summary) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StatCardsRow summary={summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RequisitionByPersonCard data={summary.requisitions.byPerson} />
        <DocumentTypeDonutChart summary={summary} />
      </div>

      <RecentItemsCard items={summary.recentActivity} />
    </div>
  )
}
