import { useNavigate } from 'react-router-dom'
import { useAssetsQuery } from '@/hooks/useAssets'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { AssetStatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/stores/auth.store'
import { HolderType } from '@/api/types/common.types'
import { formatThaiDate } from '@/lib/formatters'
import type { Asset } from '@/api/types/asset.types'

export function MyItemsPage() {
  usePageTitle('รายการของฉัน')
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const { data, isLoading } = useAssetsQuery({ holderType: HolderType.EMPLOYEE, limit: 200 })
  const myAssets = (data?.data ?? []).filter((a) => a.currentHolderId === currentUser?.employeeId)

  const columns: DataTableColumn<Asset>[] = [
    { key: 'name', header: 'ชื่อทรัพย์สิน', render: (a) => <span className="font-medium">{a.assetName}</span> },
    { key: 'category', header: 'หมวดหมู่', render: (a) => a.category?.categoryName ?? '-' },
    { key: 'status', header: 'สถานะ', render: (a) => (a.currentStatus ? <AssetStatusPill status={a.currentStatus} /> : '-') },
    { key: 'location', header: 'สถานที่', render: (a) => a.currentLocation?.locationName ?? '-' },
    { key: 'warranty', header: 'หมดประกัน', render: (a) => (a.warrantyExpireDate ? formatThaiDate(a.warrantyExpireDate) : '-') },
  ]

  if (!currentUser?.employeeId) {
    return <EmptyState message="บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน จึงไม่มีรายการทรัพย์สินที่ถืออยู่" />
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        ทรัพย์สินที่อยู่ในความดูแลของ {currentUser.employee?.fullName ?? currentUser.username} ({myAssets.length} รายการ)
      </p>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={myAssets}
            rowKey={(a) => a.assetId}
            isLoading={isLoading}
            emptyMessage="คุณไม่มีทรัพย์สินที่ถืออยู่ในขณะนี้"
            onRowClick={(a) => navigate(`/assets/${a.assetId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
