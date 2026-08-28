import { useParams } from 'react-router-dom'
import { useDisposalQuery } from '@/hooks/useDisposal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DetailSheet } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { AttachmentsPanel } from '@/components/attachments/AttachmentsPanel'
import { DISPOSAL_METHOD_LABEL } from '@/lib/constants'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'

export function DisposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const disposalId = Number(id)
  usePageTitle(`การจำหน่ายทิ้ง #${id}`)
  const { data: disposal, isLoading, isError, error, refetch } = useDisposalQuery(disposalId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !disposal) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบรายการจำหน่ายทิ้งนี้" />
  }

  return (
    <div>
      <BackLink />
      <DetailSheet>
      <div>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {disposal.asset ? disposal.asset.assetName : `ทรัพย์สิน #${disposal.assetId}`}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{DISPOSAL_METHOD_LABEL[disposal.disposalMethod]}</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-400">วันที่จำหน่าย</dt>
          <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(disposal.disposalDate)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">มูลค่าที่ขายได้</dt>
          <dd className="text-slate-700 dark:text-slate-200">
            {disposal.saleAmount != null ? `${formatCurrency(disposal.saleAmount)} บาท` : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">ผู้อนุมัติ</dt>
          <dd className="text-slate-700 dark:text-slate-200">{disposal.approvedByEmployee?.fullName ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">วันที่บันทึก</dt>
          <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(disposal.createdAt)}</dd>
        </div>
        {disposal.reason && (
          <div className="col-span-2">
            <dt className="text-slate-400">เหตุผล</dt>
            <dd className="text-slate-700 dark:text-slate-200">{disposal.reason}</dd>
          </div>
        )}
      </dl>

      <AttachmentsPanel referenceType="disposal" referenceId={disposal.disposalId} />
      </DetailSheet>
    </div>
  )
}
