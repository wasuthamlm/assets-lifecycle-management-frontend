export type NotificationType =
  | 'requisition_pending_approval'
  | 'requisition_approved'
  | 'requisition_rejected'
  | 'warranty_expiring'
  | 'assignment_overdue'
  | 'employee_profile_completed'
  | 'permissions_updated'
  | 'repair_reported'
  | 'repair_status_updated'
  | 'assignment_issued'
  | 'assignment_returned'

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
