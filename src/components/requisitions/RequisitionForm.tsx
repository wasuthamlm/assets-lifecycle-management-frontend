import { useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Eye } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useEmployeeDirectoryQuery } from '@/hooks/useEmployees'
import { useAssetsQuery } from '@/hooks/useAssets'
import { RequestType } from '@/api/types/common.types'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { optionalDateString, optionalPositiveInt } from '@/lib/zodHelpers'
import type { CreateRequisitionDto } from '@/api/types/requisition.types'

const itemSchema = z.object({
  assetId: optionalPositiveInt(),
  quantity: optionalPositiveInt(),
})

const formSchema = z.object({
  requestType: z.nativeEnum(RequestType),
  dueDate: optionalDateString(),
  reason: z.string().optional(),
  items: z.array(itemSchema).min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ'),
  approverIds: z
    .array(z.object({ employeeId: z.coerce.number().int().positive('กรุณาเลือกผู้อนุมัติ') }))
    .min(1, 'กรุณาเพิ่มผู้อนุมัติอย่างน้อย 1 คน'),
})

export type RequisitionFormValues = z.output<typeof formSchema>
type RequisitionFormInput = z.input<typeof formSchema>

interface RequisitionFormProps {
  requestedByName?: string
  defaultDocNo?: string
  defaultAssetId?: number
  onSubmit: (dto: CreateRequisitionDto) => void
  isSubmitting?: boolean
}

function toDto(values: RequisitionFormValues): CreateRequisitionDto {
  return {
    requestType: values.requestType,
    dueDate: values.requestType === RequestType.BORROW ? values.dueDate : undefined,
    reason: values.reason,
    items: values.items.map((i) => ({ assetId: i.assetId, quantity: i.quantity })),
    approverIds: values.approverIds.map((a) => a.employeeId),
  }
}

export function RequisitionForm({
  requestedByName,
  defaultDocNo,
  defaultAssetId,
  onSubmit,
  isSubmitting,
}: RequisitionFormProps) {
  const { data: employees = [] } = useEmployeeDirectoryQuery()
  const { data: assetsPage } = useAssetsQuery({ limit: 100 })
  const assets = assetsPage?.data ?? []
  // ซ่อนทรัพย์สินที่ไม่เหลือของว่างให้เบิก/ยืม ออกจาก dropdown เลือกรายการ (เผื่อ defaultAssetId ที่เลือกไว้แล้วเสมอ)
  const selectableAssets = assets.filter((a) => (a.availableCount ?? 0) > 0 || a.assetId === defaultAssetId)
  const [previewValues, setPreviewValues] = useState<RequisitionFormValues | null>(null)

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RequisitionFormInput, unknown, RequisitionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestType: RequestType.WITHDRAW,
      items: [defaultAssetId ? { assetId: defaultAssetId, quantity: 1 } : {}],
      approverIds: [{ employeeId: undefined as unknown as number }],
    },
  })

  const itemsArray = useFieldArray({ control, name: 'items' })
  const approversArray = useFieldArray({ control, name: 'approverIds' })
  const requestType = watch('requestType')

  const employeeName = (id?: number) => employees.find((e) => e.employeeId === id)?.fullName ?? '-'
  const assetLabel = (id?: number) => {
    const asset = assets.find((a) => a.assetId === id)
    return asset ? `${asset.assetNo} — ${asset.assetName}` : '-'
  }

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(toDto(values)))} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เลขที่เอกสาร</label>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="font-mono text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400">
              {defaultDocNo ?? 'กำลังโหลด...'}
            </span>
            <span className="text-xs text-slate-400">ระบบสร้างให้อัตโนมัติ</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้ขอเบิก</label>
          <div className="flex h-10 items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            {requestedByName ?? 'บัญชีของคุณ'}
          </div>
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
              <Controller
                control={control}
                name={`items.${idx}.assetId` as const}
                render={({ field: assetField }) => (
                  <Select
                    value={assetField.value ?? ''}
                    onChange={(e) => assetField.onChange(e.target.value)}
                    onBlur={assetField.onBlur}
                    name={assetField.name}
                    className="flex-1"
                  >
                    <option value="">เลือกทรัพย์สิน</option>
                    {selectableAssets.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        {a.assetNo} — {a.assetName}
                      </option>
                    ))}
                  </Select>
                )}
              />
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

      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={handleSubmit((values) => setPreviewValues(values))}>
          <Eye size={16} /> ดูตัวอย่างเอกสาร
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคำขอ'}
        </Button>
      </div>

      <Modal open={!!previewValues} onClose={() => setPreviewValues(null)} title="ตัวอย่างเอกสารใบขอเบิก/ยืม">
        {previewValues && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="font-mono text-base font-semibold text-brand-600 dark:text-brand-400">
                {defaultDocNo ?? 'กำลังโหลด...'}
              </span>
              <span className="text-xs text-slate-400">{formatThaiDate(new Date())}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">ผู้ขอเบิก</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{requestedByName ?? 'บัญชีของคุณ'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">ประเภทคำขอ</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{REQUEST_TYPE_LABEL[previewValues.requestType]}</p>
              </div>
              {previewValues.requestType === RequestType.BORROW && previewValues.dueDate && (
                <div>
                  <p className="text-xs text-slate-400">กำหนดคืน</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{formatThaiDate(previewValues.dueDate)}</p>
                </div>
              )}
            </div>

            {previewValues.reason && (
              <div>
                <p className="text-xs text-slate-400">เหตุผล</p>
                <p className="text-slate-700 dark:text-slate-200">{previewValues.reason}</p>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs text-slate-400">รายการทรัพย์สิน</p>
              <ul className="space-y-1 rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                {previewValues.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                    <span>{assetLabel(item.assetId)}</span>
                    <span className="text-slate-400">x{item.quantity ?? 1}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-1 text-xs text-slate-400">ลำดับผู้อนุมัติ</p>
              <ol className="space-y-1 rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                {previewValues.approverIds.map((a, idx) => (
                  <li key={idx} className="text-slate-700 dark:text-slate-200">
                    {idx + 1}. {employeeName(a.employeeId)}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setPreviewValues(null)}>
                แก้ไข
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  onSubmit(toDto(previewValues))
                  setPreviewValues(null)
                }}
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึกคำขอ'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </form>
  )
}
