import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useRequisitionsQuery } from '@/hooks/useRequisitions'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { ApprovalStatusPill } from '@/components/ui/StatusPill'
import { APPROVAL_STATUS_LABEL, REQUEST_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { ApprovalStatus, RequestType } from '@/api/types/common.types'
import type { Requisition } from '@/api/types/requisition.types'

const PAGE_SIZE = 20

export function RequisitionsListPage() {
  usePageTitle('ใบขอเบิก/ยืม')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useRequisitionsQuery({
    search: debouncedSearch || undefined,
    status: (status || undefined) as ApprovalStatus | undefined,
    page,
    limit: PAGE_SIZE,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleStatusChange(value: string) {
    setStatus(value)
  }

  const columns: DataTableColumn<Requisition>[] = [
    { key: 'no', header: 'เลขที่เอกสาร', render: (r) => <span className="font-medium">{r.requisitionNo}</span> },
    { key: 'requester', header: 'ผู้ขอเบิก', render: (r) => r.requestedByEmployee?.fullName ?? '-' },
    { key: 'type', header: 'ประเภท', render: (r) => REQUEST_TYPE_LABEL[r.requestType] },
    {
      key: 'items',
      header: 'รายการ',
      className: 'max-w-xs whitespace-normal',
      render: (r) => {
        const names = r.items.map((item) =>
          item.asset ? `${item.asset.assetNo} — ${item.asset.assetName}` : `Stock item #${item.stockItemId}`,
        )
        const text = names.join(', ')
        return (
          <span className="line-clamp-2" title={text}>
            {text || '-'}
          </span>
        )
      },
    },
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ค้นหาเลขที่เอกสารหรือผู้ขอเบิก..."
            className="max-w-xs"
          />
          <Select value={status} onChange={(e) => handleStatusChange(e.target.value)} className="max-w-[10rem]">
            <option value="">ทุกสถานะ</option>
            {Object.values(ApprovalStatus).map((s) => (
              <option key={s} value={s}>
                {APPROVAL_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => navigate('/requisitions/new')}>
          <Plus size={16} /> สร้างรายการใหม่
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(r) => r.requisitionId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onRowClick={(r) => navigate(`/requisitions/${r.requisitionId}`)}
            emptyMessage={search || status ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีใบขอเบิก/ยืม'}
            emptyAction={
              !search && !status ? (
                <Button size="sm" onClick={() => navigate('/requisitions/new')}>
                  <Plus size={16} /> สร้างรายการใหม่
                </Button>
              ) : undefined
            }
          />
        </div>
        {data && <Pagination page={page} totalItems={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
      </Card>
    </div>
  )
}
