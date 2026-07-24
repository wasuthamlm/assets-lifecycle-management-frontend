import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { DashboardSummary } from '../types/dashboard.types'

export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>(ENDPOINTS.dashboard.summary)
    return data
  },
}
