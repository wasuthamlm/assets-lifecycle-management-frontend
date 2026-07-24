import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { usePurchaseOrdersQuery } from '@/hooks/usePurchaseOrders'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { PoStatusPill } from '@/components/ui/StatusPill'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'
import type { PurchaseOrder } from '@/api/types/purchase-order.types'

export function PurchaseOrdersListPage() {
  usePageTitle('ใบสั่งซื้อ')
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = usePurchaseOrdersQuery()
  const [search, setSearch] = useState('')

  const filtered = orders.filter(
    (po) =>
      po.poNo.toLowerCase().includes(search.toLowerCase()) ||
      (po.vendor?.vendorName ?? '').toLowerCase().includes(search.toLowerCase()),
  )

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
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขที่ใบสั่งซื้อหรือผู้ขาย..."
          className="max-w-xs"
        />
        <Button onClick={() => navigate('/purchasing/new')}>
          <Plus size={16} /> สร้างใบสั่งซื้อใหม่
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(po) => po.poId}
            isLoading={isLoading}
            onRowClick={(po) => navigate(`/purchasing/${po.poId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
