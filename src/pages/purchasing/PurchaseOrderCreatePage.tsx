import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreatePurchaseOrderMutation } from '@/hooks/usePurchaseOrders'
import { PurchaseOrderForm } from '@/components/purchasing/PurchaseOrderForm'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CreatePurchaseOrderDto } from '@/api/types/purchase-order.types'

export function PurchaseOrderCreatePage() {
  usePageTitle('สร้างใบสั่งซื้อ')
  const navigate = useNavigate()
  const create = useCreatePurchaseOrderMutation()

  function handleSubmit(dto: CreatePurchaseOrderDto) {
    create.mutate(dto, {
      onSuccess: (po) => {
        toast.success('สร้างใบสั่งซื้อเรียบร้อยแล้ว')
        navigate(`/purchasing/${po.poId}`)
      },
      onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
    })
  }

  return (
    <div>
      <BackLink />
      <Card>
        <PurchaseOrderForm onSubmit={handleSubmit} isSubmitting={create.isPending} />
      </Card>
    </div>
  )
}
