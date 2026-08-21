import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { usePurchaseOrderQuery, useUpdatePurchaseOrderStatusMutation } from '@/hooks/usePurchaseOrders'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { DetailSheet, Section } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { PoStatusPill } from '@/components/ui/StatusPill'
import { PoStatus } from '@/api/types/common.types'
import { PO_STATUS_LABEL } from '@/lib/constants'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const poId = Number(id)
  usePageTitle(`ใบสั่งซื้อ #${id}`)
  const { data: po, isLoading, isError, error, refetch } = usePurchaseOrderQuery(poId)
  const updateStatus = useUpdatePurchaseOrderStatusMutation(poId)
  const { hasPermission } = usePermission()
  const [nextStatus, setNextStatus] = useState<PoStatus | ''>('')

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !po) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบใบสั่งซื้อนี้" />
  }

  function handleUpdateStatus() {
    if (!nextStatus) return
    updateStatus.mutate(
      { status: nextStatus },
      {
        onSuccess: () => {
          toast.success('อัปเดตสถานะเรียบร้อยแล้ว')
          setNextStatus('')
        },
        onError: (error) => toast.error(getErrorMessage(error, 'อัปเดตไม่สำเร็จ')),
      },
    )
  }

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <Section>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{po.poNo}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">ผู้ขาย: {po.vendor?.vendorName ?? '-'}</p>
            </div>
            <PoStatusPill status={po.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">วันที่สั่งซื้อ</dt>
              <dd className="text-slate-700 dark:text-slate-200">{po.orderDate ? formatThaiDate(po.orderDate) : '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">วันที่คาดว่าจะได้รับ</dt>
              <dd className="text-slate-700 dark:text-slate-200">
                {po.expectedDeliveryDate ? formatThaiDate(po.expectedDeliveryDate) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">มูลค่ารวม</dt>
              <dd className="text-slate-700 dark:text-slate-200">
                {po.totalAmount != null ? `${formatCurrency(po.totalAmount)} บาท` : '-'}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="รายการสินค้า">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {po.items.map((item) => (
              <div key={item.poItemId} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="text-slate-700 dark:text-slate-200">{item.itemDescription}</span>
                  {item.category && <span className="ml-2 text-slate-400">({item.category.categoryName})</span>}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {item.receivedQuantity}/{item.quantity}
                  {item.unitPrice != null && <span className="ml-2">× {formatCurrency(item.unitPrice)} บาท</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {hasPermission('po.approve') && (
          <Section title="อัปเดตสถานะ">
            <div className="flex items-center gap-2">
              <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as PoStatus)} className="max-w-xs">
                <option value="">เลือกสถานะใหม่</option>
                {Object.values(PoStatus).map((s) => (
                  <option key={s} value={s}>
                    {PO_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
              <Button onClick={handleUpdateStatus} disabled={!nextStatus || updateStatus.isPending}>
                {updateStatus.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </Section>
        )}
      </DetailSheet>
    </div>
  )
}
