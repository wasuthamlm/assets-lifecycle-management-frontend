import { useRequisitionsQuery } from './useRequisitions'
import { usePermission } from './usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { ApprovalStatus } from '@/api/types/common.types'
import type { Requisition } from '@/api/types/requisition.types'

export function usePendingApprovals() {
  const currentUser = useAuthStore((s) => s.user)
  const { hasAllPermissions } = usePermission()
  // ต้องมีทั้ง requisition.approve และ requisition.view_all — GET /requisitions?status=pending
  // ที่ query ด้านล่างเรียก ฝั่ง backend ต้องการ view_all เสมอ ไม่ใช่แค่ approve (requisitions.controller.ts)
  const canApprove = hasAllPermissions(['requisition.approve', 'requisition.view_all']) && !!currentUser?.employeeId
  // กรอง status=pending ที่ฝั่ง server ไว้ก่อน — ไม่ต้องโหลดใบขอที่จบไปแล้วทั้งหมดมาทิ้ง
  // เหลือแค่กรอง "ตาที่รออนุมัติอยู่เป็นของฉันไหม" ต่อฝั่ง client เพราะ backend ยังไม่มี filter ระดับนั้น
  const { data, isLoading } = useRequisitionsQuery(
    { status: ApprovalStatus.PENDING, limit: 100 },
    { enabled: canApprove },
  )

  const pendingForMe: Requisition[] = canApprove
    ? (data?.data ?? []).filter((r) => {
        const sorted = [...r.approvals].sort((a, b) => a.approvalLevel - b.approvalLevel)
        const pendingApproval = sorted.find((a) => a.status === ApprovalStatus.PENDING)
        return pendingApproval?.approverId === currentUser!.employeeId
      })
    : []

  return { pendingForMe, isLoading: canApprove && isLoading }
}
