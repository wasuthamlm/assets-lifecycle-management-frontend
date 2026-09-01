import { useNavigate } from 'react-router-dom'
import { useMyAssignmentsQuery } from '@/hooks/useAssignments'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { AssetStatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAuthStore } from '@/stores/auth.store'
import { ASSIGNMENT_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Assignment } from '@/api/types/assignment.types'

export function MyItemsPage() {
  usePageTitle('รายการของฉัน')
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  // ดึงตรงจาก GET /assignments/mine — ไม่ใช่ดึง asset ทั้งหมดมากรองเอง (แบบเดิมตัดข้อมูลทิ้งได้
  // เมื่อทรัพย์สินที่มีคนถือครองทั่วบริษัทเกิน limit ของ query) และรู้ error จริงเมื่อไม่มีสิทธิ์ asset.view
  const { data, isLoading, isError, refetch } = useMyAssignmentsQuery()
  const myItems = data ?? []

  const isOverdue = (a: Assignment) => !!a.dueDate && !a.returnedDate && new Date(a.dueDate) < new Date()

  const columns: DataTableColumn<Assignment>[] = [
    { key: 'name', header: 'ชื่อทรัพย์สิน', render: (a) => <span className="font-medium">{a.asset?.assetName ?? `#${a.assetId}`}</span> },
    { key: 'category', header: 'หมวดหมู่', render: (a) => a.asset?.category?.categoryName ?? '-' },
    { key: 'status', header: 'สถานะ', render: (a) => (a.asset?.currentStatus ? <AssetStatusPill status={a.asset.currentStatus} /> : '-') },
    { key: 'location', header: 'สถานที่', render: (a) => a.asset?.currentLocation?.locationName ?? '-' },
    { key: 'type', header: 'ประเภทการถือครอง', render: (a) => ASSIGNMENT_TYPE_LABEL[a.assignmentType] },
    {
      key: 'due',
      header: 'กำหนดคืน',
      render: (a) =>
        a.dueDate ? (
          <span className={cn(isOverdue(a) && 'font-medium text-red-600 dark:text-red-400')}>
            {formatThaiDate(a.dueDate)}
            {isOverdue(a) && ' (เกินกำหนด)'}
          </span>
        ) : (
          '-'
        ),
    },
  ]

  if (!currentUser?.employeeId) {
    return <EmptyState message="บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน จึงไม่มีรายการทรัพย์สินที่ถืออยู่" />
  }

  if (isError) {
    return (
      <div className="py-10">
        <ErrorState message="โหลดรายการทรัพย์สินของคุณไม่สำเร็จ" onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        ทรัพย์สินที่อยู่ในความดูแลของ {currentUser.employee?.fullName ?? currentUser.username} ({myItems.length} รายการ)
      </p>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={myItems}
            rowKey={(a) => a.assignmentId}
            isLoading={isLoading}
            emptyMessage="คุณไม่มีทรัพย์สินที่ถืออยู่ในขณะนี้"
            onRowClick={(a) => navigate(`/assets/${a.assetId}`)}
          />
        </div>
      </Card>
    </div>
  )
}
