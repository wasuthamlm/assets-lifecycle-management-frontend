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
import { AssetHandoverDocument } from '@/components/requisitions/AssetHandoverDocument'
import { useEmployeeDirectoryQuery, useEmployeesQuery } from '@/hooks/useEmployees'
import { useAssetsQuery } from '@/hooks/useAssets'
import { useNextRequisitionNo } from '@/hooks/useRequisitions'
import { usePermission } from '@/hooks/usePermission'
import { AssetStatus, RequestType } from '@/api/types/common.types'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { optionalDateString, optionalPositiveInt } from '@/lib/zodHelpers'
import type { Asset } from '@/api/types/asset.types'
import type { CreateRequisitionDto } from '@/api/types/requisition.types'

// ชื่อทรัพย์สิน > ยี่ห้อ > รุ่น พร้อมจำนวนที่เหลือให้ว่างในวงเล็บ — ไม่ขึ้นต้นด้วยหมวดหมู่แล้ว
// ใช้เป็นทั้ง label เต็มในตัวอย่างเอกสาร และเป็นหัวกลุ่ม (optgroup) ของ dropdown เลือกทรัพย์สิน
function assetOptionLabel(asset: Asset): string {
  const label = [asset.assetName, asset.brand, asset.model].filter(Boolean).join(' > ')
  return `${label} (เหลือ ${asset.availableCount ?? 0} ชิ้น)`
}

// S/N คือสิ่งเดียวที่ต่างกันจริงในกลุ่มเดียวกัน — โชว์แค่นี้ในแต่ละแถวให้สั้น สแกนไว ไม่ปนกับหัวกลุ่ม
// ต่อท้ายด้วยหมายเหตุของเครื่องนั้นๆ (เช่นสภาพ/ตำหนิ) ช่วยให้ผู้เบิกตัดสินใจเลือกเครื่องได้ง่ายขึ้น
// ไม่มีหมายเหตุก็โชว์ "-" แทนที่จะซ่อนไปเฉยๆ (เหมือนกับหน้ารายละเอียดทรัพย์สิน)
function assetUnitLabel(asset: Asset): string {
  return `S/N: ${asset.serialNumber ?? `ไม่มี (#${asset.assetId})`} — หมายเหตุ: ${asset.notes || '-'}`
}

// ข้อความเต็มไว้โชว์ตอน dropdown ปิดอยู่ (attribute label ของ <option>) กันเห็นแค่ S/N ลอยๆ
// ไม่รู้ว่าเป็นเครื่องอะไร เช่นตอนมาจากปุ่ม "ทำรายการ เบิก/ยืม" ที่ preselect มาให้
function assetUnitTriggerLabel(asset: Asset): string {
  return `${asset.assetName} — ${assetUnitLabel(asset)}`
}

// จัดกลุ่มทรัพย์สินที่เลือกได้ตามรุ่น (ชื่อ+ยี่ห้อ+รุ่นเดียวกัน) ไว้ทำ optgroup — คงลำดับตามที่เจอครั้งแรก
// แต่ละกลุ่มพ่วงชื่อหมวดหมู่ (chip) ไว้ด้วย ให้ dropdown แสดงแถบกรองตามหมวดหมู่เวลามีของหลายหมวดปนกัน
function groupAssetsByModel(list: Asset[]): { label: string; chip: string; assets: Asset[] }[] {
  const groups: { label: string; chip: string; assets: Asset[] }[] = []
  const indexByLabel = new Map<string, number>()
  for (const asset of list) {
    const label = assetOptionLabel(asset)
    const existingIdx = indexByLabel.get(label)
    if (existingIdx == null) {
      indexByLabel.set(label, groups.length)
      groups.push({ label, chip: asset.category?.categoryName ?? 'ไม่มีหมวดหมู่', assets: [asset] })
    } else {
      groups[existingIdx].assets.push(asset)
    }
  }
  return groups
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
    .refine((data) => new Set(data.items.map((i) => i.assetId)).size === data.items.length, {
      message: 'มีทรัพย์สินชิ้นเดียวกันถูกเลือกซ้ำหลายรายการ',
      path: ['items'],
    })
}

export type RequisitionFormValues = z.output<ReturnType<typeof buildFormSchema>>
type RequisitionFormInput = z.input<ReturnType<typeof buildFormSchema>>

// ข้อมูล employee ที่ล็อกอินอยู่ ใช้ default ค่าที่ไม่ได้กรอก (position/department/เบอร์ติดต่อ) ให้ตัวอย่างเอกสาร
// ตรงกับที่ backend จะ default ให้จริงตอน create (ดู RequisitionsService.create) — ไม่ส่งค่า placeholder พวกนี้
// ขึ้น DTO เอง ปล่อยให้ backend resolve จาก employee record ตรงๆ เพื่อกันข้อมูลเพี้ยนถ้า onBehalf เปลี่ยนคน
interface RequesterEmployeeInfo {
  employeeCode?: string | null
  position?: string | null
  phone?: string | null
  department?: string | null
}

interface RequisitionFormProps {
  requestedByName?: string
  requestedByEmployee?: RequesterEmployeeInfo | null
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
  requestedByEmployee,
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
  // กรอง status=in_stock ที่ query ตรงๆ — ไม่พึ่ง availableCount (นับรวมของ "รุ่นเดียวกัน" ทั้งหมด) เพียว
  // เพราะ availableCount ของแถวหนึ่งจะยังนับรวมพี่น้องรุ่นเดียวกันที่ยัง in_stock อยู่ แม้ตัวมันเองถูกเบิก/ยืม
  // ไปแล้วก็ตาม — ถ้าไม่กรองตรงนี้ เครื่องที่มีคนเบิกไปแล้วจะยังโผล่เป็นตัวเลือกได้ถ้ารุ่นเดียวกันยังมีของเหลือ
  const { data: assetsPage } = useAssetsQuery({ limit: 100, status: AssetStatus.IN_STOCK })
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

  const assetLabel = (id?: number) => {
    const asset = assets.find((a) => a.assetId === id)
    return asset ? assetOptionLabel(asset) : '-'
  }
  // ผู้ขอตัวจริงที่จะไปโผล่ในเอกสาร — ถ้าเลือก "เบิกแทน" ไว้ ให้ใช้ชื่อพนักงานคนนั้นแทนบัญชีที่ล็อกอินอยู่
  const onBehalfName = (id?: number) => allEmployees.find((e) => e.employeeId === id)?.fullName
  const displayedRequesterName = (onBehalfId?: number) => onBehalfName(onBehalfId) ?? requestedByName ?? 'บัญชีของคุณ'
  // ใช้ทำ placeholder ในฟอร์ม + ตัวอย่างเอกสาร ให้ตรงกับค่าที่ backend จะ default ให้จริง (employee ของคนที่
  // จะเป็นเจ้าของคำขอจริง — ตัวเองหรือคนที่เลือก "เบิกแทน" ไว้)
  const effectiveEmployeeDefaults = (onBehalfId?: number): RequesterEmployeeInfo | null => {
    const onBehalfEmployee = onBehalfId ? allEmployees.find((e) => e.employeeId === onBehalfId) : undefined
    if (onBehalfEmployee) {
      return {
        employeeCode: onBehalfEmployee.employeeCode,
        position: onBehalfEmployee.position,
        phone: onBehalfEmployee.phone,
        department: onBehalfEmployee.department?.departmentName ?? null,
      }
    }
    return requestedByEmployee ?? null
  }

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
            // ทรัพย์สินที่แถวอื่นเลือกไปแล้วต้องเอาออกจากตัวเลือกของแถวนี้ กันเลือกเครื่องเดียวกันซ้ำ 2 แถว
            const pickedElsewhere = new Set(
              watchedValues.items
                ?.map((item, i) => (i === idx ? undefined : Number(item?.assetId)))
                .filter((id): id is number => !!id),
            )
            const rowSelectableAssets = selectableAssets.filter((a) => !pickedElsewhere.has(a.assetId))
            const assetGroups = groupAssetsByModel(rowSelectableAssets)
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
                        {assetGroups.map((group) => (
                          <optgroup key={group.label} label={group.label} data-chip={group.chip}>
                            {group.assets.map((a) => (
                              <option key={a.assetId} value={a.assetId} label={assetUnitTriggerLabel(a)}>
                                {assetUnitLabel(a)}
                              </option>
                            ))}
                          </optgroup>
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

      <Modal open={!!previewValues} onClose={() => setPreviewValues(null)} title="ตัวอย่างใบส่งมอบ-ส่งคืนทรัพย์สิน" size="xl">
        {previewValues && (
          <div className="space-y-4">
            {/* พื้นสีเทาจำลองโต๊ะวางกระดาษ ให้กระดาษ A4 สีขาวเด้งเป็นแผ่นเอกสารจริงชัดเจน — ขนาดคงที่ 210mm
                เท่ากระดาษจริงเสมอไม่ยืดตามจอ ห่อด้วย overflow-x-auto กันจอแคบตัดขอบกระดาษ */}
            <div className="overflow-x-auto rounded-xl bg-slate-100 p-6 dark:bg-slate-950/40 sm:p-10">
              <div className="mx-auto">
                {(() => {
                  const previewEmployee = effectiveEmployeeDefaults(previewValues.onBehalfOfEmployeeId)
                  return (
                <AssetHandoverDocument
                  requisitionNo={docNo ?? 'กำลังโหลด...'}
                  requestType={previewValues.requestType}
                  documentDate={new Date()}
                  employeeName={displayedRequesterName(previewValues.onBehalfOfEmployeeId)}
                  position={previewEmployee?.position}
                  department={previewEmployee?.department}
                  employeeCode={previewEmployee?.employeeCode}
                  contactPhone={previewEmployee?.phone}
                  items={previewValues.items.map((item, idx) => {
                    const asset = assets.find((a) => a.assetId === Number(item.assetId))
                    return {
                      seq: idx + 1,
                      name: asset ? asset.assetName : assetLabel(item.assetId),
                      brand: asset?.brand ?? '',
                      model: asset?.model ?? '',
                      serialNumber: asset?.serialNumber ?? '',
                      note: asset?.notes ?? '',
                    }
                  })}
                />
                  )
                })()}
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
