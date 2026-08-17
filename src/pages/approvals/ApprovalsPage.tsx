import { useNavigate } from 'react-router-dom'
import { usePendingApprovals } from '@/hooks/usePendingApprovals'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { ApprovalStatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/stores/auth.store'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import type { Requisition } from '@/api/types/requisition.types'

export function ApprovalsPage() {
  usePageTitle('รออนุมัติ')
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { pendingForMe, isLoading } = usePendingApprovals()

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
      <div className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          รายการที่รอการอนุมัติจากคุณ{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">({pendingForMe.length} รายการ)</span>
        </p>
      </div>

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
