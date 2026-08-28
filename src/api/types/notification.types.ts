export type NotificationType =
  | 'requisition_pending_approval'
  | 'requisition_approved'
  | 'requisition_rejected'
  | 'warranty_expiring'
  | 'assignment_overdue'
  | 'employee_profile_completed'
  | 'permissions_updated'

export interface AppNotification {
  notificationId: number
  recipientEmployeeId: number
  type: NotificationType
  title: string
  message: string
  referenceType: string | null
  referenceId: number | null
  isRead: boolean
  dismissedAt: string | null
  createdAt: string
}
