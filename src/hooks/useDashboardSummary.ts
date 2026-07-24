import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/api/services/dashboard.service'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardService.summary(),
  })
}
