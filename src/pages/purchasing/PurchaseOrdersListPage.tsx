import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { usePurchaseOrdersQuery } from '@/hooks/usePurchaseOrders'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { PoStatusPill } from '@/components/ui/StatusPill'
import { PO_STATUS_LABEL } from '@/lib/constants'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'
import { PoStatus } from '@/api/types/common.types'
import type { PurchaseOrder } from '@/api/types/purchase-order.types'

const PAGE_SIZE = 20

export function PurchaseOrdersListPage() {
  usePageTitle('ใบสั่งซื้อ')
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const { data: orders = [], isLoading, isError, refetch } = usePurchaseOrdersQuery()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const filtered = orders.filter(
    (po) =>
      (po.poNo.toLowerCase().includes(search.toLowerCase()) ||
        (po.vendor?.vendorName ?? '').toLowerCase().includes(search.toLowerCase())) &&
      (!status || po.status === status),
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

  const columns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'no', header: 'เลขที่ใบสั่งซื้อ', render: (po) => <span className="font-medium">{po.poNo}</span> },
    { key: 'vendor', header: 'ผู้ขาย', render: (po) => po.vendor?.vendorName ?? '-' },
    { key: 'status', header: 'สถานะ', render: (po) => <PoStatusPill status={po.status} /> },
    {
      key: 'total',
      header: 'มูลค่ารวม',
      render: (po) => (po.totalAmount != null ? `${formatCurrency(po.totalAmount)} บาท` : '-'),
    },
    { key: 'date', header: 'วันที่สั่งซื้อ', render: (po) => (po.orderDate ? formatThaiDate(po.orderDate) : '-') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="ค้นหาเลขที่ใบสั่งซื้อหรือผู้ขาย..."
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => handleStatusChange(e.target.value)} className="max-w-[10rem]">
          <option value="">ทุกสถานะ</option>
          {Object.values(PoStatus).map((s) => (
            <option key={s} value={s}>
              {PO_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        {hasPermission('po.create') && (
          <Button className="ml-auto" onClick={() => navigate('/purchasing/new')}>
            <Plus size={16} /> สร้างใบสั่งซื้อ
          </Button>
        )}
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={pageRows}
            rowKey={(po) => po.poId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onRowClick={(po) => navigate(`/purchasing/${po.poId}`)}
            emptyMessage={search || status ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีใบสั่งซื้อ'}
            emptyAction={
              !search && !status && hasPermission('po.create') ? (
                <Button size="sm" onClick={() => navigate('/purchasing/new')}>
                  <Plus size={16} /> สร้างใบสั่งซื้อ
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
