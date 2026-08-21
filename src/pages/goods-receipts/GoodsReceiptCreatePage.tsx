import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateGoodsReceiptMutation } from '@/hooks/useGoodsReceipts'
import { GoodsReceiptForm } from '@/components/goods-receipts/GoodsReceiptForm'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CreateGoodsReceiptDto } from '@/api/types/goods-receipt.types'

export function GoodsReceiptCreatePage() {
  usePageTitle('บันทึกรับของ')
  const navigate = useNavigate()
  const create = useCreateGoodsReceiptMutation()

  function handleSubmit(dto: CreateGoodsReceiptDto) {
    create.mutate(dto, {
      onSuccess: (receipt) => {
        toast.success('บันทึกรับของเรียบร้อยแล้ว')
        navigate(`/goods-receipts/${receipt.receiptId}`)
      },
      onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
    })
  }

  return (
    <div>
      <BackLink />
      <Card>
        <GoodsReceiptForm onSubmit={handleSubmit} isSubmitting={create.isPending} />
      </Card>
    </div>
  )
}
