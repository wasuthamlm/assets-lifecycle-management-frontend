import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Eye } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useEmployeeDirectoryQuery, useEmployeesQuery } from '@/hooks/useEmployees'
import { useAssetsQuery } from '@/hooks/useAssets'
import { useNextRequisitionNo } from '@/hooks/useRequisitions'
import { usePermission } from '@/hooks/usePermission'
import { RequestType } from '@/api/types/common.types'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { optionalDateString, optionalPositiveInt } from '@/lib/zodHelpers'
import type { Asset } from '@/api/types/asset.types'
import type { CreateRequisitionDto } from '@/api/types/requisition.types'

// ชื่อทรัพย์สิน > ยี่ห้อ > รุ่น พร้อมจำนวนที่เหลือให้ว่างในวงเล็บ — ไม่ขึ้นต้นด้วยหมวดหมู่แล้ว
function assetOptionLabel(asset: Asset): string {
  const label = [asset.assetName, asset.brand, asset.model].filter(Boolean).join(' > ')
  return `${label} (เหลือ ${asset.availableCount ?? 0} ชิ้น)`
}

// รับ assets เข้ามาสร้าง schema ใหม่ทุกครั้งที่ข้อมูลทรัพย์สินเปลี่ยน เพื่อเช็คจำนวนที่กรอกเทียบ
// กับจำนวนที่เหลือให้ว่างจริงของแต่ละทรัพย์สินที่เลือก (กรอกเกินจำนวนที่มีไม่ได้)
function buildFormSchema(assets: Asset[]) {
  const itemSchema = z
    .object({
      assetId: z.coerce.number().int().positive('กรุณาเลือกทรัพย์สิน'),
      quantity: z.coerce.number().int().positive('กรุณากรอกจำนวน'),
    })
    .superRefine((item, ctx) => {
      const asset = assets.find((a) => a.assetId === item.assetId)
      const available = asset?.availableCount ?? 0
      if (asset && item.quantity > available) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quantity'],
          message: `จำนวนเกินกว่าที่มีอยู่ (เหลือ ${available} ชิ้น)`,
        })
      }
    })

  return z
    .object({
      requestType: z.nativeEnum(RequestType),
      dueDate: optionalDateString(),
      reason: z.string().optional(),
      onBehalfOfEmployeeId: optionalPositiveInt('กรุณาเลือกพนักงาน'),
      items: z.array(itemSchema).min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ'),
      approverIds: z
        .array(z.object({ employeeId: z.coerce.number().int().positive('กรุณาเลือกผู้อนุมัติ') }))
        .min(1, 'กรุณาเพิ่มผู้อนุมัติอย่างน้อย 1 คน'),
    })
    .refine((data) => data.requestType !== RequestType.BORROW || !!data.dueDate, {
      message: 'กรุณาระบุกำหนดคืน',
      path: ['dueDate'],
    })
}

export type RequisitionFormValues = z.output<ReturnType<typeof buildFormSchema>>
type RequisitionFormInput = z.input<ReturnType<typeof buildFormSchema>>

interface RequisitionFormProps {
  requestedByName?: string
  defaultAssetId?: number
  onSubmit: (dto: CreateRequisitionDto) => void
  isSubmitting?: boolean
}

function toDto(values: RequisitionFormValues): CreateRequisitionDto {
  return {
    requestType: values.requestType,
    dueDate: values.requestType === RequestType.BORROW ? values.dueDate : undefined,
    reason: values.reason,
    onBehalfOfEmployeeId: values.onBehalfOfEmployeeId,
    items: values.items.map((i) => ({ assetId: i.assetId, quantity: i.quantity })),
    approverIds: values.approverIds.map((a) => a.employeeId),
  }
}

export function RequisitionForm({
  requestedByName,
  defaultAssetId,
  onSubmit,
  isSubmitting,
}: RequisitionFormProps) {
  const { data: employees = [] } = useEmployeeDirectoryQuery()
  const { hasPermission } = usePermission()
  // เบิก/ยืมแทนคนอื่นได้เฉพาะคนที่มี requisition.view_all (hr/it_admin) — ต้องตรงกับเงื่อนไขที่
  // backend เช็คใน RequisitionsService.create() ไม่งั้น employee ทั่วไปจะเห็นช่องนี้ทั้งที่ยิงจริงไม่ผ่าน
  const canRequestOnBehalf = hasPermission('requisition.view_all')
  const { data: allEmployees = [] } = useEmployeesQuery({ enabled: canRequestOnBehalf })
  const { data: assetsPage } = useAssetsQuery({ limit: 100 })
  const assets = useMemo(() => assetsPage?.data ?? [], [assetsPage])
  // ซ่อนทรัพย์สินที่ไม่เหลือของว่างให้เบิก/ยืมออกจาก dropdown เสมอ — แม้แต่ทรัพย์สินที่มากับ
  // defaultAssetId (เช่นเปิดหน้านี้ผ่านลิงก์/URL ตรงๆ ตอนของยังว่าง แล้วของหมดไปก่อนหน้าโหลดเสร็จ)
  // เพราะปุ่ม "ทำรายการ" หน้ารายการทรัพย์สินก็ disable ไว้แล้วเมื่อของหมด ต้องกันไม่ให้หลุดเข้ามาทำรายการได้ทางนี้
  const selectableAssets = assets.filter((a) => (a.availableCount ?? 0) > 0)
  const [previewValues, setPreviewValues] = useState<RequisitionFormValues | null>(null)
  const [defaultAssetUnavailable, setDefaultAssetUnavailable] = useState(false)
  const formSchema = useMemo(() => buildFormSchema(assets), [assets])

  const {
    register,
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequisitionFormInput, unknown, RequisitionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestType: RequestType.WITHDRAW,
      items: [defaultAssetId ? { assetId: defaultAssetId, quantity: 1 } : {}],
      approverIds: [{ employeeId: undefined as unknown as number }],
    },
  })

  // เช็คซ้ำหลัง assets โหลดเสร็จ — ถ้าทรัพย์สินที่ preselect มาไม่พร้อมให้ทำรายการแล้ว ให้เคลียร์ออก
  // แทนที่จะปล่อยให้ค้างเป็นค่าที่เลือกไม่ได้จริง แล้วไปพังตอน submit
  useEffect(() => {
    if (!defaultAssetId || !assetsPage) return
    const asset = assets.find((a) => a.assetId === defaultAssetId)
    if (!asset || (asset.availableCount ?? 0) === 0) {
      setValue('items.0.assetId', undefined as unknown as number)
      setDefaultAssetUnavailable(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsPage, defaultAssetId])

  const itemsArray = useFieldArray({ control, name: 'items' })
  const approversArray = useFieldArray({ control, name: 'approverIds' })
  const watchedValues = watch()
  const requestType = watchedValues.requestType
  const docNo = useNextRequisitionNo(requestType)

  // ใช้ตรวจว่ากรอกช่อง required ครบหรือยัง เพื่อ enable/disable ปุ่มดูตัวอย่าง — ไม่ใช่ validate เต็มรูปแบบ (ปล่อยให้ zodResolver ทำตอน submit)
  const isFormComplete =
    !!requestType &&
    (requestType !== RequestType.BORROW || !!watchedValues.dueDate) &&
    watchedValues.items.length > 0 &&
    watchedValues.items.every((i) => {
      if (!i?.assetId || !i?.quantity) return false
      const asset = assets.find((a) => a.assetId === Number(i.assetId))
      return !asset || Number(i.quantity) <= (asset.availableCount ?? 0)
    }) &&
    watchedValues.approverIds.length > 0 &&
    watchedValues.approverIds.every((a) => !!a?.employeeId)

  const employeeName = (id?: number) => employees.find((e) => e.employeeId === id)?.fullName ?? '-'
  const assetLabel = (id?: number) => {
    const asset = assets.find((a) => a.assetId === id)
    return asset ? assetOptionLabel(asset) : '-'
  }
  // ผู้ขอตัวจริงที่จะไปโผล่ในเอกสาร — ถ้าเลือก "เบิกแทน" ไว้ ให้ใช้ชื่อพนักงานคนนั้นแทนบัญชีที่ล็อกอินอยู่
  const onBehalfName = (id?: number) => allEmployees.find((e) => e.employeeId === id)?.fullName
  const displayedRequesterName = (onBehalfId?: number) => onBehalfName(onBehalfId) ?? requestedByName ?? 'บัญชีของคุณ'

  return (
    <form noValidate onSubmit={handleSubmit((values) => onSubmit(toDto(values)))} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            ประเภทคำขอ <span className="text-red-600">*</span>
          </label>
          <Select {...register('requestType')}>
            {Object.values(RequestType).map((t) => (
              <option key={t} value={t}>
                {REQUEST_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เลขที่เอกสาร</label>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="font-mono text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400">
              {docNo ?? 'กำลังโหลด...'}
            </span>
            <span className="text-xs text-slate-400">ระบบสร้างให้อัตโนมัติ</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้ขอเบิก</label>
          {canRequestOnBehalf ? (
            <>
              <Select {...register('onBehalfOfEmployeeId')}>
                <option value="">{requestedByName ?? 'บัญชีของคุณ'} (ตัวเอง)</option>
                {allEmployees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.employeeCode} - {e.fullName}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-400">เลือกพนักงานคนอื่นถ้าเบิก/ยืมแทน เช่น เตรียมอุปกรณ์ให้พนักงานใหม่</p>
            </>
          ) : (
            <div className="flex h-10 items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              {requestedByName ?? 'บัญชีของคุณ'}
            </div>
          )}
        </div>

        {requestType === RequestType.BORROW && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              กำหนดคืน <span className="text-red-600">*</span>
            </label>
            <Input type="date" {...register('dueDate')} />
            {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            รายการทรัพย์สิน <span className="text-red-600">*</span>
          </label>
          <Button type="button" variant="secondary" size="sm" onClick={() => itemsArray.append({ assetId: undefined as unknown as number, quantity: undefined as unknown as number })}>
            <Plus size={14} /> เพิ่มรายการ
          </Button>
        </div>
        {defaultAssetUnavailable && (
          <p className="mb-2 text-xs text-red-600">
            ทรัพย์สินที่เลือกไว้ไม่พร้อมให้ทำรายการแล้ว (ไม่มีของว่างเหลือ) กรุณาเลือกรายการอื่น
          </p>
        )}
        <div className="space-y-2">
          {itemsArray.fields.map((field, idx) => {
            const selectedAssetId = Number(watchedValues.items?.[idx]?.assetId)
            const selectedAsset = assets.find((a) => a.assetId === selectedAssetId)
            const maxQuantity = selectedAsset?.availableCount ?? undefined
            const enteredQuantity = Number(watchedValues.items?.[idx]?.quantity)
            const exceedsMax = typeof maxQuantity === 'number' && enteredQuantity > maxQuantity
            const quantityError = errors.items?.[idx]?.quantity?.message
            return (
              <div key={field.id}>
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`items.${idx}.assetId` as const}
                    render={({ field: assetField }) => (
                      <Select
                        value={(assetField.value as string) ?? ''}
                        onChange={(e) => assetField.onChange(e.target.value)}
                        onBlur={assetField.onBlur}
                        name={assetField.name}
                        className="flex-1"
                      >
                        <option value="">เลือกทรัพย์สิน</option>
                        {selectableAssets.map((a) => (
                          <option key={a.assetId} value={a.assetId}>
                            {assetOptionLabel(a)}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  <Input
                    type="number"
                    min={1}
                    max={maxQuantity}
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
                {quantityError || exceedsMax ? (
                  <p className="mt-1 text-xs text-red-600">
                    {quantityError ?? `จำนวนเกินกว่าที่มีอยู่ (เหลือ ${maxQuantity} ชิ้น)`}
                  </p>
                ) : (
                  typeof maxQuantity === 'number' && (
                    <p className="mt-1 text-xs text-slate-400">มีของว่างให้เบิก/ยืมสูงสุด {maxQuantity} ชิ้น</p>
                  )
                )}
              </div>
            )
          })}
        </div>
        {errors.items && <p className="mt-1 text-xs text-red-600">{errors.items.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เหตุผล</label>
        <Textarea rows={3} {...register('reason')} placeholder="ระบุเหตุผลการเบิก/ยืม" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            ลำดับผู้อนุมัติ (เรียงตามลำดับชั้น) <span className="text-red-600">*</span>
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
        <Button
          type="button"
          variant="secondary"
          disabled={!isFormComplete}
          onClick={handleSubmit((values) => setPreviewValues(values))}
        >
          <Eye size={16} /> ดูตัวอย่างเอกสาร
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคำขอ'}
        </Button>
      </div>

      <Modal open={!!previewValues} onClose={() => setPreviewValues(null)} title="ตัวอย่างเอกสารใบขอเบิก/ยืม" size="xl">
        {previewValues && (
          <div className="space-y-4">
            {/* พื้นสีเทาจำลองโต๊ะวางกระดาษ ให้กระดาษ A4 สีขาวเด้งเป็นแผ่นเอกสารจริงชัดเจน — ขนาดคงที่ 210mm
                เท่ากระดาษจริงเสมอไม่ยืดตามจอ ห่อด้วย overflow-x-auto กันจอแคบตัดขอบกระดาษ */}
            <div className="overflow-x-auto rounded-xl bg-slate-100 p-6 dark:bg-slate-950/40 sm:p-10">
              {/* พื้นขาว/ตัวหนังสือเข้มคงที่เสมอ ไม่ตามธีมมืด เพราะเป็นตัวอย่างเอกสารพิมพ์ */}
              <div className="mx-auto min-h-[297mm] w-[210mm] max-w-none bg-white p-12 text-slate-900 shadow-xl">
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-300 pb-4">
                  <h2 className="text-lg font-bold">
                    {previewValues.requestType === RequestType.BORROW ? 'ใบขอยืมทรัพย์สิน' : 'ใบขอเบิกทรัพย์สิน'}
                  </h2>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">เลขที่เอกสาร</p>
                    <p className="font-mono text-sm font-semibold">{docNo ?? 'กำลังโหลด...'}</p>
                  </div>
                </div>

                <table className="mb-6 w-full border-collapse text-sm">
                  <tbody>
                    <tr>
                      <td className="w-32 border border-slate-300 bg-slate-50 px-3 py-2 font-medium">ผู้ขอเบิก/ยืม</td>
                      <td className="border border-slate-300 px-3 py-2" colSpan={3}>
                        {displayedRequesterName(previewValues.onBehalfOfEmployeeId)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-medium">ประเภทคำขอ</td>
                      <td className="border border-slate-300 px-3 py-2">{REQUEST_TYPE_LABEL[previewValues.requestType]}</td>
                      <td className="w-32 border border-slate-300 bg-slate-50 px-3 py-2 font-medium">วันที่เอกสาร</td>
                      <td className="border border-slate-300 px-3 py-2">{formatThaiDate(new Date())}</td>
                    </tr>
                    {previewValues.requestType === RequestType.BORROW && previewValues.dueDate && (
                      <tr>
                        <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-medium">กำหนดคืน</td>
                        <td className="border border-slate-300 px-3 py-2" colSpan={3}>
                          {formatThaiDate(previewValues.dueDate)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <table className="mb-6 w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="w-10 border border-slate-300 px-3 py-2 text-left">#</th>
                      <th className="border border-slate-300 px-3 py-2 text-left">รายการทรัพย์สิน</th>
                      <th className="w-20 border border-slate-300 px-3 py-2 text-right">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewValues.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 px-3 py-2">{assetLabel(item.assetId)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right">{item.quantity ?? 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {previewValues.reason && (
                  <div className="mb-6">
                    <p className="mb-1 text-sm font-medium">เหตุผล</p>
                    <p className="rounded border border-slate-300 px-3 py-2 text-sm">{previewValues.reason}</p>
                  </div>
                )}

                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="w-14 border border-slate-300 px-3 py-2 text-left">ลำดับ</th>
                      <th className="border border-slate-300 px-3 py-2 text-left">ผู้อนุมัติ</th>
                      <th className="w-32 border border-slate-300 px-3 py-2 text-left">ลงชื่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewValues.approverIds.map((a, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 px-3 py-2">{employeeName(a.employeeId)}</td>
                        <td className="border border-slate-300 px-3 py-2">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
