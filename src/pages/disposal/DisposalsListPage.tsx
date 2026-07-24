import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useDisposalsQuery } from '@/hooks/useDisposal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { DISPOSAL_METHOD_LABEL } from '@/lib/constants'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'
import type { Disposal } from '@/api/types/disposal.types'

export function DisposalsListPage() {
  usePageTitle('จำหน่ายทิ้ง')
  const navigate = useNavigate()
  const { data: disposals = [], isLoading } = useDisposalsQuery()
  const [search, setSearch] = useState('')

  const filtered = disposals.filter(
    (d) =>
      (d.asset?.assetNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.asset?.assetName ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<Disposal>[] = [
    { key: 'asset', header: 'ทรัพย์สิน', render: (d) => (d.asset ? `${d.asset.assetNo} — ${d.asset.assetName}` : '-') },
    { key: 'method', header: 'วิธีจำหน่าย', render: (d) => DISPOSAL_METHOD_LABEL[d.disposalMethod] },
    { key: 'date', header: 'วันที่จำหน่าย', render: (d) => formatThaiDate(d.disposalDate) },
    { key: 'amount', header: 'มูลค่าที่ขายได้', render: (d) => (d.saleAmount != null ? `${formatCurrency(d.saleAmount)} บาท` : '-') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขทรัพย์สินหรือชื่อ..."
          className="max-w-xs"
        />
        <Button onClick={() => navigate('/disposal/new')}>
          <Plus size={16} /> บันทึกการจำหน่ายทิ้ง
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(d) => d.disposalId}
            isLoading={isLoading}
            onRowClick={(d) => navigate(`/disposal/${d.disposalId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
