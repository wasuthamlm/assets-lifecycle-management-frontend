import { useRequisitionsQuery } from './useRequisitions'
import { usePermission } from './usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { ApprovalStatus } from '@/api/types/common.types'
import type { Requisition } from '@/api/types/requisition.types'

export function usePendingApprovals() {
  const currentUser = useAuthStore((s) => s.user)
  const { hasPermission } = usePermission()
  const canApprove = hasPermission('requisition.approve') && !!currentUser?.employeeId
  const { data: requisitions = [], isLoading } = useRequisitionsQuery({ enabled: canApprove })

  const pendingForMe: Requisition[] = canApprove
    ? requisitions.filter((r) => {
        if (r.overallStatus !== ApprovalStatus.PENDING) return false
        const sorted = [...r.approvals].sort((a, b) => a.approvalLevel - b.approvalLevel)
        const pendingApproval = sorted.find((a) => a.status === ApprovalStatus.PENDING)
        return pendingApproval?.approverId === currentUser!.employeeId
      })
    : []

  return { pendingForMe, isLoading: canApprove && isLoading }
}
