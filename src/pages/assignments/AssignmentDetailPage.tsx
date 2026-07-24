import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { RotateCcw } from 'lucide-react'
import { useAssignmentQuery, useReturnAssetMutation } from '@/hooks/useAssignments'
import { useAssetQuery } from '@/hooks/useAssets'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ReturnAssetForm } from '@/components/assignments/ReturnAssetForm'
import { useAuthStore } from '@/stores/auth.store'
import { ASSIGNMENT_TYPE_LABEL, HOLDER_TYPE_LABEL, RETURN_CONDITION_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import type { ApiErrorShape } from '@/api/types/common.types'
import type { ReturnAssetDto } from '@/api/types/assignment.types'

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const assignmentId = Number(id)
  usePageTitle(`การเบิก-จ่าย #${id}`)
  const { data: assignment, isLoading } = useAssignmentQuery(assignmentId)
  const { data: asset } = useAssetQuery(assignment?.assetId ?? 0)
  const returnMutation = useReturnAssetMutation(assignmentId)
  const currentUser = useAuthStore((s) => s.user)
  const [returnOpen, setReturnOpen] = useState(false)

  if (isLoading || !assignment) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  function handleReturn(dto: ReturnAssetDto) {
    returnMutation.mutate(dto, {
      onSuccess: () => {
        toast.success('บันทึกการรับคืนเรียบร้อยแล้ว')
        setReturnOpen(false)
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
    <div className="max-w-2xl space-y-6">
      <Card>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {asset ? `${asset.assetNo} — ${asset.assetName}` : `ทรัพย์สิน #${assignment.assetId}`}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {ASSIGNMENT_TYPE_LABEL[assignment.assignmentType]} · {HOLDER_TYPE_LABEL[assignment.holderType]} #
              {assignment.holderId}
            </p>
          </div>
          {!assignment.returnedDate && (
            <Button size="sm" onClick={() => setReturnOpen(true)}>
              <RotateCcw size={14} /> รับคืน
            </Button>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">วันที่เบิก-จ่าย</dt>
            <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(assignment.issuedDate)}</dd>
          </div>
          {assignment.dueDate && (
            <div>
              <dt className="text-slate-400">กำหนดคืน</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(assignment.dueDate)}</dd>
            </div>
          )}
          {assignment.returnedDate && (
            <>
              <div>
                <dt className="text-slate-400">วันที่คืน</dt>
                <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(assignment.returnedDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">สภาพเมื่อคืน</dt>
                <dd className="text-slate-700 dark:text-slate-200">
                  {assignment.returnCondition ? RETURN_CONDITION_LABEL[assignment.returnCondition] : '-'}
                </dd>
              </div>
            </>
          )}
          {assignment.notes && (
            <div className="col-span-2">
              <dt className="text-slate-400">หมายเหตุ</dt>
              <dd className="text-slate-700 dark:text-slate-200">{assignment.notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="รับคืนทรัพย์สิน">
        <ReturnAssetForm
          defaultReceivedBy={currentUser?.employeeId ?? undefined}
          onSubmit={handleReturn}
          isSubmitting={returnMutation.isPending}
        />
      </Modal>
    </div>
  )
}
