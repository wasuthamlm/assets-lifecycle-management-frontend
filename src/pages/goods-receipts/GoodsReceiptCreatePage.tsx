import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateGoodsReceiptMutation } from '@/hooks/useGoodsReceipts'
import { GoodsReceiptForm } from '@/components/goods-receipts/GoodsReceiptForm'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'
import type { ApiErrorShape } from '@/api/types/common.types'
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
    <div>
      <BackLink />
      <Card>
        <GoodsReceiptForm onSubmit={handleSubmit} isSubmitting={create.isPending} />
      </Card>
    </div>
  )
}
