import { useState } from 'react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useApproveRequisitionMutation } from '@/hooks/useRequisitions'
import { ApprovalStatus } from '@/api/types/common.types'
import type { ApiErrorShape } from '@/api/types/common.types'

export function ApprovalActionPanel({ requisitionId }: { requisitionId: number }) {
  const [comment, setComment] = useState('')
  const approve = useApproveRequisitionMutation(requisitionId)

  function act(status: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED) {
    approve.mutate(
      { status, comment: comment || undefined },
      {
        onSuccess: () => toast.success(status === ApprovalStatus.APPROVED ? 'อนุมัติเรียบร้อยแล้ว' : 'ปฏิเสธคำขอแล้ว'),
        onError: (error) => {
          const message =
            error instanceof AxiosError
              ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'ดำเนินการไม่สำเร็จ')
              : 'ดำเนินการไม่สำเร็จ'
          toast.error(Array.isArray(message) ? message.join(', ') : message)
        },
      },
    )
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">รอการอนุมัติจากคุณ</p>
      <Textarea
        rows={2}
        placeholder="ความเห็นเพิ่มเติม (ถ้ามี)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-3"
      />
      <div className="flex gap-2">
        <Button onClick={() => act(ApprovalStatus.APPROVED)} disabled={approve.isPending}>
          <Check size={16} /> อนุมัติ
        </Button>
        <Button variant="danger" onClick={() => act(ApprovalStatus.REJECTED)} disabled={approve.isPending}>
          <X size={16} /> ไม่อนุมัติ
        </Button>
      </div>
    </div>
  )
}
