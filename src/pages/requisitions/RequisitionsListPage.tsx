import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useRequisitionsQuery } from '@/hooks/useRequisitions'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { ApprovalStatusPill } from '@/components/ui/StatusPill'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { RequestType } from '@/api/types/common.types'
import type { Requisition } from '@/api/types/requisition.types'

export function RequisitionsListPage() {
  usePageTitle('ใบขอเบิก/ยืม')
  const navigate = useNavigate()
  const { data: requisitions = [], isLoading } = useRequisitionsQuery()
  const [search, setSearch] = useState('')

  const filtered = requisitions.filter(
    (r) =>
      r.requisitionNo.toLowerCase().includes(search.toLowerCase()) ||
      (r.requestedByEmployee?.fullName ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<Requisition>[] = [
    { key: 'no', header: 'เลขที่เอกสาร', render: (r) => <span className="font-medium">{r.requisitionNo}</span> },
    { key: 'requester', header: 'ผู้ขอเบิก', render: (r) => r.requestedByEmployee?.fullName ?? '-' },
    { key: 'type', header: 'ประเภท', render: (r) => REQUEST_TYPE_LABEL[r.requestType] },
    {
      key: 'dueDate',
      header: 'วันคืน',
      render: (r) => (r.requestType === RequestType.BORROW && r.dueDate ? formatThaiDate(r.dueDate) : '-'),
    },
    { key: 'status', header: 'สถานะ', render: (r) => <ApprovalStatusPill status={r.overallStatus} /> },
    { key: 'date', header: 'วันที่สร้าง', render: (r) => formatThaiDate(r.createdAt) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขที่เอกสารหรือผู้ขอเบิก..."
          className="max-w-xs"
        />
        <Button onClick={() => navigate('/requisitions/new')}>
          <Plus size={16} /> สร้างรายการใหม่
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.requisitionId}
            isLoading={isLoading}
            onRowClick={(r) => navigate(`/requisitions/${r.requisitionId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
