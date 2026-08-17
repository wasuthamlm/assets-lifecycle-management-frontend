import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useGoodsReceiptsQuery } from '@/hooks/useGoodsReceipts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { formatThaiDate } from '@/lib/formatters'
import type { GoodsReceipt } from '@/api/types/goods-receipt.types'

const PAGE_SIZE = 20

export function GoodsReceiptsListPage() {
  usePageTitle('รับเข้าสินค้า')
  const navigate = useNavigate()
  const { data: receipts = [], isLoading } = useGoodsReceiptsQuery()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = receipts.filter(
    (r) =>
      r.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      (r.purchaseOrder?.poNo ?? '').toLowerCase().includes(search.toLowerCase()),
  )
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const columns: DataTableColumn<GoodsReceipt>[] = [
    { key: 'no', header: 'เลขที่ใบรับของ', render: (r) => <span className="font-medium">{r.receiptNo}</span> },
    { key: 'po', header: 'ใบสั่งซื้ออ้างอิง', render: (r) => r.purchaseOrder?.poNo ?? '-' },
    { key: 'location', header: 'สถานที่รับเข้า', render: (r) => r.location?.locationName ?? '-' },
    { key: 'items', header: 'จำนวนรายการ', render: (r) => r.items?.length ?? 0 },
    { key: 'date', header: 'วันที่รับของ', render: (r) => (r.receiptDate ? formatThaiDate(r.receiptDate) : '-') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
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
            rows={pageRows}
            rowKey={(r) => r.receiptId}
            isLoading={isLoading}
            onRowClick={(r) => navigate(`/goods-receipts/${r.receiptId}`)}
            emptyMessage={search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการรับเข้าสินค้า'}
            emptyAction={
              !search ? (
                <Button size="sm" onClick={() => navigate('/goods-receipts/new')}>
                  <Plus size={16} /> บันทึกรับของใหม่
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
