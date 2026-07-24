import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useEmployeesQuery } from '@/hooks/useEmployees'
import { useAssetsQuery } from '@/hooks/useAssets'
import { RequestType } from '@/api/types/common.types'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import type { CreateRequisitionDto } from '@/api/types/requisition.types'

const itemSchema = z.object({
  assetId: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive().optional(),
})

const formSchema = z.object({
  requisitionNo: z.string().min(1, 'กรุณากรอกเลขที่เอกสาร'),
  requestedBy: z.coerce.number().int().positive('กรุณาเลือกผู้ขอเบิก'),
  requestType: z.nativeEnum(RequestType),
  dueDate: z.string().optional(),
  reason: z.string().optional(),
  items: z.array(itemSchema).min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ'),
  approverIds: z
    .array(z.object({ employeeId: z.coerce.number().int().positive('กรุณาเลือกผู้อนุมัติ') }))
    .min(1, 'กรุณาเพิ่มผู้อนุมัติอย่างน้อย 1 คน'),
})

export type RequisitionFormValues = z.output<typeof formSchema>
type RequisitionFormInput = z.input<typeof formSchema>

interface RequisitionFormProps {
  defaultRequestedBy?: number
  onSubmit: (dto: CreateRequisitionDto) => void
  isSubmitting?: boolean
}

export function RequisitionForm({ defaultRequestedBy, onSubmit, isSubmitting }: RequisitionFormProps) {
  const { data: employees = [] } = useEmployeesQuery()
  const { data: assetsPage } = useAssetsQuery({ limit: 100 })
  const assets = assetsPage?.data ?? []

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RequisitionFormInput, unknown, RequisitionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requisitionNo: '',
      requestedBy: defaultRequestedBy,
      requestType: RequestType.WITHDRAW,
      items: [{}],
      approverIds: [{ employeeId: undefined as unknown as number }],
    },
  })

  const itemsArray = useFieldArray({ control, name: 'items' })
  const approversArray = useFieldArray({ control, name: 'approverIds' })
  const requestType = watch('requestType')

  function submit(values: RequisitionFormValues) {
    onSubmit({
      requisitionNo: values.requisitionNo,
      requestedBy: values.requestedBy,
      requestType: values.requestType,
      dueDate: values.requestType === RequestType.BORROW ? values.dueDate : undefined,
      reason: values.reason,
      items: values.items.map((i) => ({ assetId: i.assetId, quantity: i.quantity })),
      approverIds: values.approverIds.map((a) => a.employeeId),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เลขที่เอกสาร</label>
          <Input {...register('requisitionNo')} placeholder="REQ-2026-0001" />
          {errors.requisitionNo && <p className="mt-1 text-xs text-red-600">{errors.requisitionNo.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้ขอเบิก</label>
          <Select {...register('requestedBy')}>
            <option value="">เลือกพนักงาน</option>
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.fullName}
              </option>
            ))}
          </Select>
          {errors.requestedBy && <p className="mt-1 text-xs text-red-600">{errors.requestedBy.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ประเภทคำขอ</label>
          <Select {...register('requestType')}>
            {Object.values(RequestType).map((t) => (
              <option key={t} value={t}>
                {REQUEST_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>

        {requestType === RequestType.BORROW && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">กำหนดคืน</label>
            <Input type="date" {...register('dueDate')} />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เหตุผล</label>
        <Textarea rows={3} {...register('reason')} placeholder="ระบุเหตุผลการเบิก/ยืม" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">รายการทรัพย์สิน</label>
          <Button type="button" variant="secondary" size="sm" onClick={() => itemsArray.append({})}>
            <Plus size={14} /> เพิ่มรายการ
          </Button>
        </div>
        <div className="space-y-2">
          {itemsArray.fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <Select {...register(`items.${idx}.assetId` as const)} className="flex-1">
                <option value="">เลือกทรัพย์สิน</option>
                {assets.map((a) => (
                  <option key={a.assetId} value={a.assetId}>
                    {a.assetNo} — {a.assetName}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={1}
                placeholder="จำนวน"
                className="w-24"
                {...register(`items.${idx}.quantity` as const)}
              />
              <button
                type="button"
                onClick={() => itemsArray.remove(idx)}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        {errors.items && <p className="mt-1 text-xs text-red-600">{errors.items.message}</p>}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            ลำดับผู้อนุมัติ (เรียงตามลำดับชั้น)
          </label>
          <Button type="button" variant="secondary" size="sm" onClick={() => approversArray.append({ employeeId: undefined as unknown as number })}>
            <Plus size={14} /> เพิ่มผู้อนุมัติ
          </Button>
        </div>
        <div className="space-y-2">
          {approversArray.fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-sm text-slate-400">{idx + 1}.</span>
              <Select {...register(`approverIds.${idx}.employeeId` as const)} className="flex-1">
                <option value="">เลือกผู้อนุมัติ</option>
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.fullName}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => approversArray.remove(idx)}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        {errors.approverIds && <p className="mt-1 text-xs text-red-600">{errors.approverIds.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคำขอ'}
      </Button>
    </form>
  )
}
