import { useEffect, useState } from 'react'
import { useMovementsQuery } from '@/hooks/useMovements'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { MOVEMENT_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { MovementType } from '@/api/types/common.types'
import type { Movement } from '@/api/types/movement.types'

const PAGE_SIZE = 20

export function MovementsListPage() {
  usePageTitle('ประวัติการเคลื่อนไหว')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [movementType, setMovementType] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useMovementsQuery({
    search: debouncedSearch || undefined,
    movementType: (movementType || undefined) as MovementType | undefined,
    page,
    limit: PAGE_SIZE,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, movementType])

  const columns: DataTableColumn<Movement>[] = [
    { key: 'date', header: 'วันที่', render: (m) => formatThaiDate(m.createdAt) },
    { key: 'asset', header: 'ทรัพย์สิน', render: (m) => (m.asset ? m.asset.assetName : `#${m.assetId}`) },
    { key: 'type', header: 'ประเภทการเคลื่อนไหว', render: (m) => MOVEMENT_TYPE_LABEL[m.movementType] },
    { key: 'holder', header: 'ผู้เบิก/ยืม', render: (m) => m.toHolderEmployee?.fullName ?? '-' },
    { key: 'holderCode', header: 'รหัสพนักงาน', render: (m) => m.toHolderEmployee?.employeeCode ?? '-' },
    { key: 'holderDept', header: 'แผนก', render: (m) => m.toHolderEmployee?.department?.departmentName ?? '-' },
    { key: 'from', header: 'จาก', render: (m) => m.fromLocation?.locationName ?? '-' },
    { key: 'to', header: 'ไปยัง', render: (m) => m.toLocation?.locationName ?? '-' },
    { key: 'by', header: 'ผู้ดำเนินการ', render: (m) => m.performedByEmployee?.fullName ?? '-' },
    { key: 'notes', header: 'หมายเหตุ', render: (m) => m.notes ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ/เลขทรัพย์สิน, ผู้ดำเนินการ, หรือหมายเหตุ..."
          className="max-w-xs"
        />
        <Select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="max-w-[14rem]">
          <option value="">ทุกประเภทการเคลื่อนไหว</option>
          {Object.values(MovementType).map((t) => (
            <option key={t} value={t}>
              {MOVEMENT_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(m) => m.movementId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyMessage={search || movementType ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีประวัติการเคลื่อนไหว'}
          />
        </div>
        {data && <Pagination page={page} totalItems={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
      </Card>
    </div>
  )
}
