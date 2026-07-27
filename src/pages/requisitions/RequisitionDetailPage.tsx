import { useParams } from 'react-router-dom'
import { useRequisitionQuery } from '@/hooks/useRequisitions'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DetailSheet, Section } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { ApprovalStatusPill } from '@/components/ui/StatusPill'
import { Timeline, type TimelineStep } from '@/components/ui/Timeline'
import { ApprovalActionPanel } from '@/components/requisitions/ApprovalActionPanel'
import { useAuthStore } from '@/stores/auth.store'
import { ApprovalStatus } from '@/api/types/common.types'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'

export function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const requisitionId = Number(id)
  usePageTitle(`ใบขอเบิก/ยืม #${id}`)
  const { data: requisition, isLoading } = useRequisitionQuery(requisitionId)
  const currentUser = useAuthStore((s) => s.user)

  if (isLoading || !requisition) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const sortedApprovals = [...requisition.approvals].sort((a, b) => a.approvalLevel - b.approvalLevel)
  const pendingApproval = sortedApprovals.find((a) => a.status === ApprovalStatus.PENDING)
  const isMyTurn = !!currentUser?.employeeId && pendingApproval?.approverId === currentUser.employeeId

  const approvalSteps: TimelineStep[] = sortedApprovals.map((approval) => ({
    label: `ลำดับ ${approval.approvalLevel} · ${approval.approver?.fullName ?? '-'}`,
    timestamp: approval.actionedAt ? formatThaiDate(approval.actionedAt) : undefined,
    description: approval.comment ?? undefined,
    status:
      approval.status === ApprovalStatus.APPROVED
        ? 'done'
        : approval.status === ApprovalStatus.REJECTED
          ? 'rejected'
          : approval.approvalId === pendingApproval?.approvalId
            ? 'current'
            : 'pending',
  }))

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <Section>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{requisition.requisitionNo}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {REQUEST_TYPE_LABEL[requisition.requestType]} · โดย {requisition.requestedByEmployee?.fullName ?? '-'}
              </p>
            </div>
            <ApprovalStatusPill status={requisition.overallStatus} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">วันที่สร้าง</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(requisition.createdAt)}</dd>
            </div>
            {requisition.dueDate && (
              <div>
                <dt className="text-slate-400">กำหนดคืน</dt>
                <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(requisition.dueDate)}</dd>
              </div>
            )}
            {requisition.reason && (
              <div className="col-span-2">
                <dt className="text-slate-400">เหตุผล</dt>
                <dd className="text-slate-700 dark:text-slate-200">{requisition.reason}</dd>
              </div>
            )}
          </dl>
        </Section>

        <Section title="รายการทรัพย์สิน">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {requisition.items.map((item) => (
              <div key={item.requisitionItemId} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  {item.asset ? `${item.asset.assetNo} — ${item.asset.assetName}` : `Stock item #${item.stockItemId}`}
                </span>
                {item.quantity && <span className="text-slate-400">x{item.quantity}</span>}
              </div>
            ))}
          </div>
        </Section>

        <Section title="ลำดับการอนุมัติ">
          <Timeline steps={approvalSteps} />
        </Section>

        {isMyTurn && pendingApproval && (
          <Section>
            <ApprovalActionPanel requisitionId={requisition.requisitionId} />
          </Section>
        )}
      </DetailSheet>
    </div>
  )
}
