import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { useAssignmentQuery, useReturnAssetMutation } from '@/hooks/useAssignments'
import { useAssetQuery } from '@/hooks/useAssets'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DetailSheet, Section } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Timeline, type TimelineStep } from '@/components/ui/Timeline'
import { ReturnAssetForm } from '@/components/assignments/ReturnAssetForm'
import { ASSIGNMENT_TYPE_LABEL, HOLDER_TYPE_LABEL, RETURN_CONDITION_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { ReturnAssetDto } from '@/api/types/assignment.types'

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const assignmentId = Number(id)
  usePageTitle(`การเบิก-จ่าย #${id}`)
  const { data: assignment, isLoading, isError, error, refetch } = useAssignmentQuery(assignmentId)
  const { data: asset } = useAssetQuery(assignment?.assetId ?? 0)
  const returnMutation = useReturnAssetMutation(assignmentId)
  const [returnOpen, setReturnOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !assignment) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบรายการเบิก-จ่ายนี้" />
  }

  function handleReturn(dto: ReturnAssetDto) {
    returnMutation.mutate(dto, {
      onSuccess: () => {
        toast.success('บันทึกการรับคืนเรียบร้อยแล้ว')
        setReturnOpen(false)
      },
      onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
    })
  }

  const steps: TimelineStep[] = [
    {
      label: 'เบิก-จ่ายทรัพย์สิน',
      timestamp: formatThaiDate(assignment.issuedDate),
      status: 'done',
    },
    {
      label: 'รับคืน',
      timestamp: assignment.returnedDate ? formatThaiDate(assignment.returnedDate) : undefined,
      description: assignment.returnedDate
        ? `สภาพเมื่อคืน: ${assignment.returnCondition ? RETURN_CONDITION_LABEL[assignment.returnCondition] : '-'}`
        : assignment.dueDate
          ? `กำหนดคืน: ${formatThaiDate(assignment.dueDate)}`
          : undefined,
      status: assignment.returnedDate ? 'done' : 'current',
    },
  ]

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <Section>
          <div className="flex items-start justify-between">
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
          {assignment.notes && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">หมายเหตุ: </span>
              {assignment.notes}
            </p>
          )}
        </Section>

        <Section title="สถานะ">
          <Timeline steps={steps} />
        </Section>
      </DetailSheet>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="รับคืนทรัพย์สิน">
        <ReturnAssetForm onSubmit={handleReturn} isSubmitting={returnMutation.isPending} />
      </Modal>
    </div>
  )
}
