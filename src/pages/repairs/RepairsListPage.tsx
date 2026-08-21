import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useRepairsQuery } from '@/hooks/useRepairs'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { RepairStatusPill } from '@/components/ui/StatusPill'
import { REPAIR_STATUS_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { RepairStatus } from '@/api/types/common.types'
import type { Repair } from '@/api/types/repair.types'

const PAGE_SIZE = 20

export function RepairsListPage() {
  usePageTitle('ซ่อมบำรุง')
  const navigate = useNavigate()
  const { data: repairs = [], isLoading, isError, refetch } = useRepairsQuery()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const filtered = repairs.filter(
    (r) =>
      ((r.asset?.assetNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.asset?.assetName ?? '').toLowerCase().includes(search.toLowerCase())) &&
      (!status || r.status === status),
  )
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatus(value)
    setPage(1)
  }

  const columns: DataTableColumn<Repair>[] = [
    {
      key: 'asset',
      header: 'ทรัพย์สิน',
      render: (r) => <span className="font-medium">{r.asset ? `${r.asset.assetNo} — ${r.asset.assetName}` : '-'}</span>,
    },
    { key: 'problem', header: 'ปัญหา', render: (r) => r.problemDescription ?? '-' },
    { key: 'vendor', header: 'ผู้รับซ่อม', render: (r) => r.vendor?.vendorName ?? 'ซ่อมภายใน' },
    { key: 'status', header: 'สถานะ', render: (r) => <RepairStatusPill status={r.status} /> },
    { key: 'date', header: 'วันที่แจ้งซ่อม', render: (r) => formatThaiDate(r.createdAt) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ค้นหาเลขทรัพย์สินหรือชื่อ..."
            className="max-w-xs"
          />
          <Select value={status} onChange={(e) => handleStatusChange(e.target.value)} className="max-w-[10rem]">
            <option value="">ทุกสถานะ</option>
            {Object.values(RepairStatus).map((s) => (
              <option key={s} value={s}>
                {REPAIR_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => navigate('/repairs/new')}>
          <Plus size={16} /> แจ้งซ่อมใหม่
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={pageRows}
            rowKey={(r) => r.repairId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onRowClick={(r) => navigate(`/repairs/${r.repairId}`)}
            emptyMessage={search || status ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการแจ้งซ่อม'}
            emptyAction={
              !search && !status ? (
                <Button size="sm" onClick={() => navigate('/repairs/new')}>
                  <Plus size={16} /> แจ้งซ่อมใหม่
                </Button>
              ) : undefined
            }
          />
        </div>
        <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </Card>
    </div>
  )
}
