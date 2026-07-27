import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreatePurchaseOrderMutation, useNextPoNo } from '@/hooks/usePurchaseOrders'
import { PurchaseOrderForm } from '@/components/purchasing/PurchaseOrderForm'
import { Card } from '@/components/ui/Card'
import type { ApiErrorShape } from '@/api/types/common.types'
import type { CreatePurchaseOrderDto } from '@/api/types/purchase-order.types'

export function PurchaseOrderCreatePage() {
  usePageTitle('สร้างใบสั่งซื้อ')
  const navigate = useNavigate()
  const create = useCreatePurchaseOrderMutation()
  const nextDocNo = useNextPoNo()

  function handleSubmit(dto: CreatePurchaseOrderDto) {
    create.mutate(dto, {
      onSuccess: (po) => {
        toast.success('สร้างใบสั่งซื้อเรียบร้อยแล้ว')
        navigate(`/purchasing/${po.poId}`)
      },
      onError: (error) => {
        const message =
          error instanceof AxiosError
            ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'บันทึกไม่สำเร็จ')
            : 'บันทึกไม่สำเร็จ'
        toast.error(Array.isArray(message) ? message.join(', ') : message)
      },
    })
  }

  return (
    <Card>
      <PurchaseOrderForm defaultDocNo={nextDocNo} onSubmit={handleSubmit} isSubmitting={create.isPending} />
    </Card>
  )
}
