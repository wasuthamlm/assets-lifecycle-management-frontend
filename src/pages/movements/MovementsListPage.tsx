import { useMovementsQuery } from '@/hooks/useMovements'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { MOVEMENT_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import type { Movement } from '@/api/types/movement.types'

export function MovementsListPage() {
  usePageTitle('ประวัติการเคลื่อนไหว')
  const { data: movements = [], isLoading } = useMovementsQuery()

  const columns: DataTableColumn<Movement>[] = [
    { key: 'date', header: 'วันที่', render: (m) => formatThaiDate(m.createdAt) },
    { key: 'asset', header: 'ทรัพย์สิน', render: (m) => (m.asset ? `${m.asset.assetNo} — ${m.asset.assetName}` : `#${m.assetId}`) },
    { key: 'type', header: 'ประเภทการเคลื่อนไหว', render: (m) => MOVEMENT_TYPE_LABEL[m.movementType] },
    { key: 'from', header: 'จาก', render: (m) => m.fromLocation?.locationName ?? '-' },
    { key: 'to', header: 'ไปยัง', render: (m) => m.toLocation?.locationName ?? '-' },
    { key: 'by', header: 'ผู้ดำเนินการ', render: (m) => m.performedByEmployee?.fullName ?? '-' },
    { key: 'notes', header: 'หมายเหตุ', render: (m) => m.notes ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <div className="p-4">
          <DataTable columns={columns} rows={movements} rowKey={(m) => m.movementId} isLoading={isLoading} />
        </div>
      </Card>
    </div>
  )
}
