import { useParams, useNavigate } from 'react-router-dom'
import { useAssetQuery } from '@/hooks/useAssets'
import { useWarrantiesByAssetQuery } from '@/hooks/useWarranty'
import { useAssignmentsByAssetQuery } from '@/hooks/useAssignments'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { DetailSheet, Section } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { Button } from '@/components/ui/Button'
import { AssetStatusPill } from '@/components/ui/StatusPill'
import { AttachmentsPanel } from '@/components/attachments/AttachmentsPanel'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'
import { ASSIGNMENT_TYPE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { isAssignmentOverdue } from '@/lib/assignment'
import { resolveAssetHolderName, resolveHolderDepartment, resolveHolderName, resolveHolderPhone } from '@/lib/holder'
import { WarrantyStatus } from '@/api/types/common.types'

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const assetId = Number(id)
  usePageTitle(`ทรัพย์สิน #${id}`)
  const navigate = useNavigate()
  const { data: asset, isLoading, isError, error, refetch } = useAssetQuery(assetId)
  const { data: warranties = [] } = useWarrantiesByAssetQuery(assetId)
  // backend เรียง issuedDate DESC มาแล้ว — ตัวแรกคือการเบิก/ยืมครั้งล่าสุด
  const { data: assignments = [] } = useAssignmentsByAssetQuery(assetId)
  // หน้า /assignments/:id ต้องมี assignment.view_all — ไม่มีสิทธิ์ก็ไม่โชว์ลิงก์
  const canViewAssignment = usePermission().hasPermission('assignment.view_all')

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !asset) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบทรัพย์สินนี้" />
  }

  const renewableWarranty = warranties.find((w) => w.status !== WarrantyStatus.RENEWED)
  const holderName = resolveAssetHolderName(asset)
  const latestAssignment = assignments[0]
  const isLatestOverdue = !!latestAssignment && isAssignmentOverdue(latestAssignment)

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{asset.assetName}</p>
            {(asset.brand || asset.model) && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{[asset.brand, asset.model].filter(Boolean).join(' ')}</p>
            )}
          </div>
          {asset.currentStatus && <AssetStatusPill status={asset.currentStatus} />}
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">หมวดหมู่หลัก</dt>
            <dd className="text-slate-700 dark:text-slate-200">
              {(asset.category?.parent?.categoryName ?? asset.category?.categoryName) || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">หมวดหมู่ย่อย</dt>
            {/* asset.category ไม่มี parent แปลว่ามันคือหมวดหมู่หลักเอง (ไม่ได้แยกหมวดหมู่ย่อย) — ไม่ใช่หมวดหมู่ย่อยที่หายไป
                (ดู AssetCreatePage: หมวดหมู่ย่อยไม่บังคับสร้าง ถ้าชื่อหมวดหมู่หลักสื่อความหมายพอแล้ว) */}
            <dd className="text-slate-700 dark:text-slate-200">{(asset.category?.parent ? asset.category.categoryName : null) ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Serial Number</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.serialNumber ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">ยี่ห้อ</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.brand ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">รุ่น</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.model ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">ผู้ขาย</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.vendor?.vendorName ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">วันที่ซื้อ</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.purchaseDate ? formatThaiDate(asset.purchaseDate) : '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">มูลค่า</dt>
            <dd className="text-slate-700 dark:text-slate-200">
              {asset.purchaseCost != null ? `${formatCurrency(asset.purchaseCost)} บาท` : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">วันหมดประกัน</dt>
            <dd className="text-slate-700 dark:text-slate-200">
              {asset.warrantyExpireDate ? formatThaiDate(asset.warrantyExpireDate) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">ผู้ถือครองปัจจุบัน</dt>
            <dd className="text-slate-700 dark:text-slate-200">{holderName ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">สถานที่ปัจจุบัน</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.currentLocation?.locationName ?? '-'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-400">หมายเหตุ</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.notes || '-'}</dd>
          </div>
        </dl>

        {latestAssignment && (
          <Section
            title="ผู้ถือครองล่าสุด"
            action={
              canViewAssignment && (
                <Button variant="secondary" size="sm" onClick={() => navigate(`/assignments/${latestAssignment.assignmentId}`)}>
                  ดูรายละเอียด
                </Button>
              )
            }
          >
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">ชื่อผู้ถือครอง</dt>
                <dd className="text-slate-700 dark:text-slate-200">{resolveHolderName(latestAssignment)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">แผนก</dt>
                <dd className="text-slate-700 dark:text-slate-200">{resolveHolderDepartment(latestAssignment)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">เบอร์โทร</dt>
                <dd className="text-slate-700 dark:text-slate-200">{resolveHolderPhone(latestAssignment)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">ประเภท</dt>
                <dd className="text-slate-700 dark:text-slate-200">{ASSIGNMENT_TYPE_LABEL[latestAssignment.assignmentType]}</dd>
              </div>
              <div>
                <dt className="text-slate-400">วันที่เบิก-จ่าย</dt>
                <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(latestAssignment.issuedDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">ผู้เบิกจ่าย</dt>
                <dd className="text-slate-700 dark:text-slate-200">{latestAssignment.issuedByEmployee?.fullName ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">กำหนดคืน</dt>
                <dd className={cn('text-slate-700 dark:text-slate-200', isLatestOverdue && 'font-medium text-red-600 dark:text-red-400')}>
                  {latestAssignment.dueDate ? formatThaiDate(latestAssignment.dueDate) : '-'}
                  {isLatestOverdue && ' (เกินกำหนด)'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">สถานะ</dt>
                <dd
                  className={cn(
                    'text-slate-700 dark:text-slate-200',
                    latestAssignment.isLateReturn && 'font-medium text-red-600 dark:text-red-400',
                  )}
                >
                  {latestAssignment.returnedDate ? `คืนแล้ว — ${formatThaiDate(latestAssignment.returnedDate)}` : 'ยังไม่คืน'}
                  {latestAssignment.returnedDate && latestAssignment.isLateReturn && ' (คืนล่าช้า)'}
                </dd>
              </div>
            </dl>
          </Section>
        )}

        <div className="mt-4">
          {renewableWarranty ? (
            <Button variant="secondary" onClick={() => navigate(`/warranty/${renewableWarranty.warrantyId}`)}>
              ต่ออายุประกัน
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate(`/warranty?assetId=${asset.assetId}`)}>
              เพิ่ม/ดูข้อมูลประกัน
            </Button>
          )}
        </div>

        <AttachmentsPanel referenceType="asset" referenceId={asset.assetId} />
      </DetailSheet>
    </div>
  )
}
