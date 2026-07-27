import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ReturnCondition } from '@/api/types/common.types'
import { RETURN_CONDITION_LABEL } from '@/lib/constants'
import type { ReturnAssetDto } from '@/api/types/assignment.types'

const formSchema = z.object({
  returnCondition: z.nativeEnum(ReturnCondition),
  notes: z.string().optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

interface ReturnAssetFormProps {
  onSubmit: (dto: ReturnAssetDto) => void
  isSubmitting?: boolean
}

export function ReturnAssetForm({ onSubmit, isSubmitting }: ReturnAssetFormProps) {
  const { register, handleSubmit } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { returnCondition: ReturnCondition.NORMAL },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">สภาพเมื่อคืน</label>
        <Select {...register('returnCondition')}>
          {Object.values(ReturnCondition).map((c) => (
            <option key={c} value={c}>
              {RETURN_CONDITION_LABEL[c]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมายเหตุ</label>
        <Textarea rows={2} {...register('notes')} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการรับคืน'}
      </Button>
    </form>
  )
}
