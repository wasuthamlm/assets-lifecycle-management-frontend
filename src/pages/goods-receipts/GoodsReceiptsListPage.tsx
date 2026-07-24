import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useGoodsReceiptsQuery } from '@/hooks/useGoodsReceipts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { formatThaiDate } from '@/lib/formatters'
import type { GoodsReceipt } from '@/api/types/goods-receipt.types'

export function GoodsReceiptsListPage() {
  usePageTitle('รับเข้าสินค้า')
  const navigate = useNavigate()
  const { data: receipts = [], isLoading } = useGoodsReceiptsQuery()
  const [search, setSearch] = useState('')

  const filtered = receipts.filter(
    (r) =>
      r.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      (r.purchaseOrder?.poNo ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<GoodsReceipt>[] = [
    { key: 'no', header: 'เลขที่ใบรับของ', render: (r) => <span className="font-medium">{r.receiptNo}</span> },
    { key: 'po', header: 'ใบสั่งซื้ออ้างอิง', render: (r) => r.purchaseOrder?.poNo ?? '-' },
    { key: 'location', header: 'สถานที่รับเข้า', render: (r) => r.location?.locationName ?? '-' },
    { key: 'items', header: 'จำนวนรายการ', render: (r) => r.items?.length ?? 0 },
    { key: 'date', header: 'วันที่รับของ', render: (r) => (r.receiptDate ? formatThaiDate(r.receiptDate) : '-') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขที่ใบรับของหรือใบสั่งซื้อ..."
          className="max-w-xs"
        />
        <Button onClick={() => navigate('/goods-receipts/new')}>
          <Plus size={16} /> บันทึกรับของใหม่
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.receiptId}
            isLoading={isLoading}
            onRowClick={(r) => navigate(`/goods-receipts/${r.receiptId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
