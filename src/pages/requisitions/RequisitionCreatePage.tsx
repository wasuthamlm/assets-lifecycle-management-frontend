import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateRequisitionMutation } from '@/hooks/useRequisitions'
import { RequisitionForm } from '@/components/requisitions/RequisitionForm'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'
import { useAuthStore } from '@/stores/auth.store'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CreateRequisitionDto } from '@/api/types/requisition.types'

export function RequisitionCreatePage() {
  usePageTitle('สร้างใบขอเบิก/ยืม')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const create = useCreateRequisitionMutation()
  const currentUser = useAuthStore((s) => s.user)
  const assetIdParam = searchParams.get('assetId')
  const defaultAssetId = assetIdParam ? Number(assetIdParam) : undefined

  function handleSubmit(dto: CreateRequisitionDto) {
    create.mutate(dto, {
      onSuccess: (requisition) => {
        toast.success('สร้างคำขอเรียบร้อยแล้ว')
        navigate(`/requisitions/${requisition.requisitionId}`)
      },
      onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
    })
  }

  return (
    <div>
      <BackLink />
      <Card>
        <RequisitionForm
          requestedByName={currentUser?.employee?.fullName ?? currentUser?.username}
          requestedByEmployee={
            currentUser?.employee
              ? {
                  employeeCode: currentUser.employee.employeeCode,
                  position: currentUser.employee.position,
                  phone: currentUser.employee.phone,
                  department: currentUser.employee.department?.departmentName ?? null,
                }
              : null
          }
          defaultAssetId={defaultAssetId}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending}
        />
      </Card>
    </div>
  )
}
