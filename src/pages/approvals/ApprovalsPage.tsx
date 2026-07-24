import { useNavigate } from 'react-router-dom'
import { useRequisitionsQuery } from '@/hooks/useRequisitions'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { ApprovalStatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/stores/auth.store'
import { ApprovalStatus } from '@/api/types/common.types'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import type { Requisition } from '@/api/types/requisition.types'

export function ApprovalsPage() {
  usePageTitle('รออนุมัติ')
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { data: requisitions = [], isLoading } = useRequisitionsQuery()

  const pendingForMe = requisitions.filter((r) => {
    if (r.overallStatus !== ApprovalStatus.PENDING) return false
    const sorted = [...r.approvals].sort((a, b) => a.approvalLevel - b.approvalLevel)
    const pendingApproval = sorted.find((a) => a.status === ApprovalStatus.PENDING)
    return !!currentUser?.employeeId && pendingApproval?.approverId === currentUser.employeeId
  })

  const columns: DataTableColumn<Requisition>[] = [
    { key: 'no', header: 'เลขที่เอกสาร', render: (r) => <span className="font-medium">{r.requisitionNo}</span> },
    { key: 'requester', header: 'ผู้ขอเบิก', render: (r) => r.requestedByEmployee?.fullName ?? '-' },
    { key: 'type', header: 'ประเภท', render: (r) => REQUEST_TYPE_LABEL[r.requestType] },
    { key: 'items', header: 'จำนวนรายการ', render: (r) => `${r.items.length} รายการ` },
    { key: 'status', header: 'สถานะ', render: (r) => <ApprovalStatusPill status={r.overallStatus} /> },
    { key: 'date', header: 'วันที่ขอ', render: (r) => formatThaiDate(r.createdAt) },
  ]

  if (!currentUser?.employeeId) {
    return <EmptyState message="บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน จึงไม่สามารถอนุมัติได้" />
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        รายการที่รอการอนุมัติจากคุณ ({pendingForMe.length} รายการ)
      </p>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={pendingForMe}
            rowKey={(r) => r.requisitionId}
            isLoading={isLoading}
            emptyMessage="ไม่มีรายการที่รอคุณอนุมัติ"
            onRowClick={(r) => navigate(`/requisitions/${r.requisitionId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
