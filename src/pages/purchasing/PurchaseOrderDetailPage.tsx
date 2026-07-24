import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { usePurchaseOrderQuery, useUpdatePurchaseOrderStatusMutation } from '@/hooks/usePurchaseOrders'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { PoStatusPill } from '@/components/ui/StatusPill'
import { PoStatus } from '@/api/types/common.types'
import type { ApiErrorShape } from '@/api/types/common.types'
import { PO_STATUS_LABEL } from '@/lib/constants'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const poId = Number(id)
  usePageTitle(`ใบสั่งซื้อ #${id}`)
  const { data: po, isLoading } = usePurchaseOrderQuery(poId)
  const updateStatus = useUpdatePurchaseOrderStatusMutation(poId)
  const { hasPermission } = usePermission()
  const currentUser = useAuthStore((s) => s.user)
  const [nextStatus, setNextStatus] = useState<PoStatus | ''>('')

  if (isLoading || !po) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  function handleUpdateStatus() {
    if (!nextStatus) return
    updateStatus.mutate(
      { status: nextStatus, approvedBy: currentUser?.employeeId ?? undefined },
      {
        onSuccess: () => {
          toast.success('อัปเดตสถานะเรียบร้อยแล้ว')
          setNextStatus('')
        },
        onError: (error) => {
          const message =
            error instanceof AxiosError
              ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'อัปเดตไม่สำเร็จ')
              : 'อัปเดตไม่สำเร็จ'
          toast.error(Array.isArray(message) ? message.join(', ') : message)
        },
      },
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{po.poNo}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">ผู้ขาย: {po.vendor?.vendorName ?? '-'}</p>
          </div>
          <PoStatusPill status={po.status} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
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
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">รายการสินค้า</h3>
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
      </Card>

      {hasPermission('po.approve') && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">อัปเดตสถานะ</h3>
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
        </Card>
      )}
    </div>
  )
}
