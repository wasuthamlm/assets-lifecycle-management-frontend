export interface DashboardRecentActivity {
  type: 'requisition' | 'asset'
  id: number
  title: string
  subtitle: string | null
  status: string | null
  createdAt: string
}

export interface DashboardByPerson {
  employeeId: number
  fullName: string
  count: number
}

export interface DashboardSummary {
  totalAssets: number
  totalAssetValue: number
  requisitions: {
    pending: number
    approved: number
    rejected: number
    byRequestType: {
      withdraw: number
      borrow: number
    }
    byPerson: DashboardByPerson[]
  }
  recentActivity: DashboardRecentActivity[]
}
