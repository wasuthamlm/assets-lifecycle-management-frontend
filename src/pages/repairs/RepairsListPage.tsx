import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useRepairsQuery } from '@/hooks/useRepairs'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { RepairStatusPill } from '@/components/ui/StatusPill'
import { formatThaiDate } from '@/lib/formatters'
import type { Repair } from '@/api/types/repair.types'

export function RepairsListPage() {
  usePageTitle('ซ่อมบำรุง')
  const navigate = useNavigate()
  const { data: repairs = [], isLoading } = useRepairsQuery()
  const [search, setSearch] = useState('')

  const filtered = repairs.filter(
    (r) =>
      (r.asset?.assetNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.asset?.assetName ?? '').toLowerCase().includes(search.toLowerCase()),
  )

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
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขทรัพย์สินหรือชื่อ..."
          className="max-w-xs"
        />
        <Button onClick={() => navigate('/repairs/new')}>
          <Plus size={16} /> แจ้งซ่อมใหม่
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.repairId}
            isLoading={isLoading}
            onRowClick={(r) => navigate(`/repairs/${r.repairId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
