import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateRequisitionMutation, useNextRequisitionNo } from '@/hooks/useRequisitions'
import { RequisitionForm } from '@/components/requisitions/RequisitionForm'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'
import { useAuthStore } from '@/stores/auth.store'
import type { ApiErrorShape } from '@/api/types/common.types'
import type { CreateRequisitionDto } from '@/api/types/requisition.types'

export function RequisitionCreatePage() {
  usePageTitle('สร้างใบขอเบิก/ยืม')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const create = useCreateRequisitionMutation()
  const currentUser = useAuthStore((s) => s.user)
  const nextDocNo = useNextRequisitionNo()
  const assetIdParam = searchParams.get('assetId')
  const defaultAssetId = assetIdParam ? Number(assetIdParam) : undefined

  function handleSubmit(dto: CreateRequisitionDto) {
    create.mutate(dto, {
      onSuccess: (requisition) => {
        toast.success('สร้างคำขอเรียบร้อยแล้ว')
        navigate(`/requisitions/${requisition.requisitionId}`)
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
        <RequisitionForm
          requestedByName={currentUser?.employee?.fullName ?? currentUser?.username}
          defaultDocNo={nextDocNo}
          defaultAssetId={defaultAssetId}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending}
        />
      </Card>
    </div>
  )
}
