import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Eye, Printer } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { HandoverDocumentPreview } from '@/components/requisitions/HandoverDocumentPreview'
import { useEmployeeDirectoryQuery, useEmployeesQuery } from '@/hooks/useEmployees'
import { useAssetsQuery } from '@/hooks/useAssets'
import { useNextRequisitionNo } from '@/hooks/useRequisitions'
import { useDepartmentsQuery } from '@/hooks/useMasterData'
import { useUsersQuery } from '@/hooks/useUsers'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { AssetStatus, RequestType } from '@/api/types/common.types'
import { REQUEST_TYPE_LABEL } from '@/lib/constants'
import { translateRoleName } from '@/lib/roleLabels'
import { requiresHrRequest } from '@/lib/requiresHrRequest'
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

// รับ assets เข้ามาสร้าง schema ใหม่ทุกครั้งที่ข้อมูลทรัพย์สินเปลี่ยน เพื่อเช็คหมวดทรัพย์สินที่เลือกได้
// แต่ละแถวคือทรัพย์สิน 1 เครื่อง (S/N เดียว) จึงไม่มีช่องกรอกจำนวน — ส่ง quantity: 1 ให้ backend เสมอ (ดู toDto)
// canRequestHrOnly = มีสิทธิ์ requisition.create_on_behalf (hr / it_admin) — ไม่ใช่ HR จะเลือกทรัพย์สินหมวดที่ต้องให้ HR เบิกให้ไม่ได้
// isAutoApproved = it_admin เป็นผู้ขอ/ผู้รับเอง backend อนุมัติให้ทันที จึงไม่ต้องเลือกผู้อนุมัติ (ดู isAutoApprovedFor)
function buildFormSchema(
  assets: Asset[],
  canRequestHrOnly: boolean,
  isAutoApproved: (data: { requesterMode?: string; onBehalfOfEmployeeId?: string }) => boolean,
) {
  const itemSchema = z
    .object({
      assetId: z.coerce.number().int().positive('กรุณาเลือกทรัพย์สิน'),
    })
    .superRefine((item, ctx) => {
      const asset = assets.find((a) => a.assetId === item.assetId)
      if (asset && !canRequestHrOnly && requiresHrRequest(asset)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['assetId'],
          message: 'ทรัพย์สินหมวดนี้ต้องให้ HR เป็นผู้ทำรายการเบิก/ยืมให้ กรุณาติดต่อ HR',
        })
      }
    })

  return z
    .object({
      requestType: z.nativeEnum(RequestType),
      dueDate: optionalDateString(),
      reason: z.string().optional(),
      // ใช้แค่ใน UI (ช่อง "เบิกให้" ของ HR) ไม่ได้ส่งไป backend — ดู toDto
      requesterMode: z.enum(['self', 'existing', 'new']).default('self'),
      // '' = ตัวเอง, '<employeeId>' = เบิกแทนพนักงานในระบบ, NEW_EMPLOYEE_OPTION = พนักงานใหม่ที่ยังไม่มีในระบบ
      onBehalfOfEmployeeId: z.string().optional(),
      newEmployee: z
        .object({
          employeeCode: z.string().optional(),
          fullName: z.string().optional(),
          departmentId: optionalPositiveInt(),
          position: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
      items: z.array(itemSchema).min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ'),
      // บังคับเลือกใน superRefine ด้านล่าง เฉพาะใบที่ไม่ได้อนุมัติอัตโนมัติ — 0 = ยังไม่ได้เลือก
      approverIds: z.array(z.object({ employeeId: z.coerce.number().int().nonnegative().optional() })),
    })
    .refine((data) => data.requestType !== RequestType.BORROW || !!data.dueDate, {
      message: 'กรุณาระบุกำหนดคืน',
      path: ['dueDate'],
    })
    .refine((data) => new Set(data.items.map((i) => i.assetId)).size === data.items.length, {
      message: 'มีทรัพย์สินชิ้นเดียวกันถูกเลือกซ้ำหลายรายการ',
      path: ['items'],
    })
    .superRefine((data, ctx) => {
      if (data.requesterMode === 'existing' && !onBehalfIdOf(data.onBehalfOfEmployeeId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['onBehalfOfEmployeeId'], message: 'กรุณาเลือกพนักงาน' })
      }
      if (!isAutoApproved(data)) {
        if (data.approverIds.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['approverIds'], message: 'กรุณาเพิ่มผู้อนุมัติอย่างน้อย 1 คน' })
        }
        data.approverIds.forEach((a, idx) => {
          if (!a.employeeId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['approverIds', idx, 'employeeId'], message: 'กรุณาเลือกผู้อนุมัติ' })
          }
        })
      }
      if (data.onBehalfOfEmployeeId !== NEW_EMPLOYEE_OPTION) return
      if (!data.newEmployee?.employeeCode?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newEmployee', 'employeeCode'], message: 'กรุณากรอกรหัสพนักงาน' })
      }
      if (!data.newEmployee?.fullName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newEmployee', 'fullName'], message: 'กรุณากรอกชื่อ-นามสกุล' })
      }
      const email = data.newEmployee?.email?.trim()
      if (email && !z.string().email().safeParse(email).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newEmployee', 'email'], message: 'รูปแบบอีเมลไม่ถูกต้อง' })
      }
    })
}

// ค่าพิเศษใน dropdown "ผู้ขอเบิก" — HR เบิกให้พนักงานใหม่ที่ยังไม่มีในระบบ (มักยังไม่มีเมล) ระบบจะสร้างข้อมูลพนักงานให้
// พร้อมใบขอ แล้วผูกกับบัญชีของคนนั้นตอน login ครั้งแรก (ดู backend RequisitionsService.create / AuthService.claimEmployee)
const NEW_EMPLOYEE_OPTION = '__new__'

type RequesterMode = 'self' | 'existing' | 'new'
const REQUESTER_MODES: { value: RequesterMode; label: string }[] = [
  { value: 'self', label: 'ตัวเอง' },
  { value: 'existing', label: 'พนักงานคนอื่น (มีในระบบแล้ว)' },
  { value: 'new', label: 'พนักงานใหม่ (ยังไม่มีในระบบ)' },
]

function onBehalfIdOf(value?: string): number | undefined {
  return value && value !== NEW_EMPLOYEE_OPTION ? Number(value) : undefined
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

function toDto(values: RequisitionFormValues, autoApproved: boolean): CreateRequisitionDto {
  const ne = values.newEmployee
  return {
    requestType: values.requestType,
    dueDate: values.requestType === RequestType.BORROW ? values.dueDate : undefined,
    reason: values.reason,
    onBehalfOfEmployeeId: onBehalfIdOf(values.onBehalfOfEmployeeId),
    newEmployee:
      values.onBehalfOfEmployeeId === NEW_EMPLOYEE_OPTION && ne
        ? {
            employeeCode: ne.employeeCode!.trim(),
            fullName: ne.fullName!.trim(),
            departmentId: ne.departmentId,
            position: ne.position?.trim() || undefined,
            email: ne.email?.trim() || undefined,
          }
        : undefined,
    // backend ยังบังคับ quantity (ใช้จริงกับ stock_item เท่านั้น) — ทรัพย์สินเป็นรายเครื่องจึงเป็น 1 เสมอ
    items: values.items.map((i) => ({ assetId: i.assetId, quantity: 1 })),
    // ใบที่อนุมัติอัตโนมัติ backend ไม่อ่าน approverIds อยู่แล้ว — ไม่ส่งไปให้สับสน
    approverIds: autoApproved ? undefined : values.approverIds.map((a) => a.employeeId!),
  }
}

export function RequisitionForm({
  requestedByName,
  requestedByEmployee,
  defaultAssetId,
  onSubmit,
  isSubmitting,
}: RequisitionFormProps) {
  const { hasPermission } = usePermission()
  // เบิก/ยืมให้คนอื่น (รวมพนักงานใหม่) ได้เฉพาะคนที่มี requisition.create_on_behalf (hr / it_admin) — พนักงานทั่วไป
  // เบิกได้แค่ให้ตัวเอง; ต้องตรงกับเงื่อนไขที่ backend เช็คใน RequisitionsService.create() ไม่งั้นจะเห็นช่องที่ยิงจริงไม่ผ่าน
  // ใช้ permission เดียวกันเป็นตัวบอกว่าเลือกทรัพย์สินหมวดที่ต้องให้ HR เบิกให้ (notebook / tablet) ได้หรือไม่
  const canRequestOnBehalf = hasPermission('requisition.create_on_behalf')
  // directory = ผู้ดูแลระบบ IT (role it_admin) เท่านั้น — ใช้เป็นตัวเลือกผู้อนุมัติ (ดู backend EmployeesService.findDirectory)
  const { data: itAdmins = [] } = useEmployeeDirectoryQuery()
  const currentEmployeeId = useAuthStore((s) => s.user?.employeeId ?? null)
  // it_admin เป็นผู้ขอ (คนที่ล็อกอิน) หรือผู้รับทรัพย์สินเอง → backend อนุมัติให้ทันที ให้ตรงกับ RequisitionsService.create()
  const isAutoApprovedFor = useMemo(() => {
    const adminIds = new Set(itAdmins.map((a) => a.employeeId))
    return (data: { requesterMode?: string; onBehalfOfEmployeeId?: string }) => {
      if (currentEmployeeId != null && adminIds.has(currentEmployeeId)) return true
      const recipientId = data.requesterMode === 'existing' ? onBehalfIdOf(data.onBehalfOfEmployeeId) : undefined
      return recipientId != null && adminIds.has(recipientId)
    }
  }, [itAdmins, currentEmployeeId])
  const { data: allEmployees = [] } = useEmployeesQuery({ enabled: canRequestOnBehalf })
  // role ของพนักงานผูกอยู่กับ user — ดึงจาก /users แบบเดียวกับหน้ารายชื่อพนักงาน (ต้องมี user.view_all)
  const { data: users = [] } = useUsersQuery({ enabled: canRequestOnBehalf && hasPermission('user.view_all') })
  const roleLabelByEmployeeId = useMemo(() => {
    const map = new Map<number, string>()
    for (const u of users) {
      const names = (u.employee?.employeeRoles ?? []).flatMap((er) => (er.role ? [translateRoleName(er.role.roleName)] : []))
      if (u.employeeId && names.length > 0) map.set(u.employeeId, names.join(', '))
    }
    return map
  }, [users])
  const { data: departments = [] } = useDepartmentsQuery()
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
  const [defaultAssetHrOnly, setDefaultAssetHrOnly] = useState(false)
  // ไม่ใช่ HR แต่มีของหมวดที่ต้องให้ HR เบิกให้อยู่ในรายการ — โชว์คำแนะนำให้ไปติดต่อ HR
  const hasHrOnlyAssets = !canRequestOnBehalf && selectableAssets.some(requiresHrRequest)
  const formSchema = useMemo(
    () => buildFormSchema(assets, canRequestOnBehalf, isAutoApprovedFor),
    [assets, canRequestOnBehalf, isAutoApprovedFor],
  )

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
      requesterMode: 'self',
      onBehalfOfEmployeeId: '',
      items: [defaultAssetId ? { assetId: defaultAssetId } : {}],
      approverIds: [{ employeeId: undefined }],
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
    } else if (!canRequestOnBehalf && requiresHrRequest(asset)) {
      setValue('items.0.assetId', undefined as unknown as number)
      setDefaultAssetHrOnly(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsPage, defaultAssetId])

  const itemsArray = useFieldArray({ control, name: 'items' })
  const approversArray = useFieldArray({ control, name: 'approverIds' })
  const watchedValues = watch()
  const requestType = watchedValues.requestType
  const docNo = useNextRequisitionNo(requestType)

  // ใช้ตรวจว่ากรอกช่อง required ครบหรือยัง เพื่อ enable/disable ปุ่มดูตัวอย่าง — ไม่ใช่ validate เต็มรูปแบบ (ปล่อยให้ zodResolver ทำตอน submit)
  const requesterMode = watchedValues.requesterMode ?? 'self'
  function changeRequesterMode(mode: RequesterMode) {
    setValue('requesterMode', mode)
    // ตัวเอง = '' (backend ใช้บัญชีที่ล็อกอิน), พนักงานในระบบ = ล้างไว้รอเลือก, พนักงานใหม่ = ค่าพิเศษ
    setValue('onBehalfOfEmployeeId', mode === 'new' ? NEW_EMPLOYEE_OPTION : '')
  }
  const isNewEmployee = watchedValues.onBehalfOfEmployeeId === NEW_EMPLOYEE_OPTION
  const autoApproved = isAutoApprovedFor(watchedValues)
  const isFormComplete =
    !!requestType &&
    (requesterMode !== 'existing' || !!onBehalfIdOf(watchedValues.onBehalfOfEmployeeId)) &&
    (!isNewEmployee || (!!watchedValues.newEmployee?.employeeCode?.trim() && !!watchedValues.newEmployee?.fullName?.trim())) &&
    (requestType !== RequestType.BORROW || !!watchedValues.dueDate) &&
    watchedValues.items.length > 0 &&
    watchedValues.items.every((i) => !!i?.assetId) &&
    (autoApproved || (watchedValues.approverIds.length > 0 && watchedValues.approverIds.every((a) => !!a?.employeeId)))

  const assetLabel = (id?: number) => {
    const asset = assets.find((a) => a.assetId === id)
    return asset ? assetOptionLabel(asset) : '-'
  }
  // ผู้ขอตัวจริงที่จะไปโผล่ในเอกสาร — ถ้าเลือก "เบิกแทน" ไว้ ให้ใช้ชื่อพนักงานคนนั้นแทนบัญชีที่ล็อกอินอยู่
  const displayedRequesterName = (values: RequisitionFormValues) => {
    if (values.onBehalfOfEmployeeId === NEW_EMPLOYEE_OPTION) return values.newEmployee?.fullName?.trim() || '-'
    const onBehalfId = onBehalfIdOf(values.onBehalfOfEmployeeId)
    return allEmployees.find((e) => e.employeeId === onBehalfId)?.fullName ?? requestedByName ?? 'บัญชีของคุณ'
  }
  // ใช้ทำ placeholder ในฟอร์ม + ตัวอย่างเอกสาร ให้ตรงกับค่าที่ backend จะ default ให้จริง (employee ของคนที่
  // จะเป็นเจ้าของคำขอจริง — ตัวเอง, คนที่เลือก "เบิกแทน" ไว้ หรือพนักงานใหม่ที่กรอกมา)
  const effectiveEmployeeDefaults = (values: RequisitionFormValues): RequesterEmployeeInfo | null => {
    if (values.onBehalfOfEmployeeId === NEW_EMPLOYEE_OPTION) {
      const ne = values.newEmployee
      return {
        employeeCode: ne?.employeeCode?.trim() || null,
        position: ne?.position?.trim() || null,
        phone: null,
        department: departments.find((d) => d.departmentId === ne?.departmentId)?.departmentName ?? null,
      }
    }
    const onBehalfId = onBehalfIdOf(values.onBehalfOfEmployeeId)
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
    <form noValidate onSubmit={handleSubmit((values) => onSubmit(toDto(values, isAutoApprovedFor(values))))} className="space-y-6">
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
          {/* ผู้ขอเบิกคือคนที่ล็อกอินทำรายการเสมอ — HR เบิกให้คนอื่น/พนักงานใหม่ ชื่อผู้ขอก็ยังเป็น HR (ผู้รับเลือกที่ช่อง "เบิกให้") */}
          <div className="flex h-10 items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            {[requestedByEmployee?.employeeCode, requestedByName ?? 'บัญชีของคุณ'].filter(Boolean).join(' · ')}
          </div>
        </div>

        {canRequestOnBehalf && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เบิกให้</label>
            <Select value={requesterMode} onChange={(e) => changeRequesterMode(e.target.value as RequesterMode)}>
              {REQUESTER_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-400">notebook / tablet ต้องให้ HR เป็นผู้ขอเบิก — เบิกให้ตัวเองหรือคนอื่นได้</p>
          </div>
        )}

        {canRequestOnBehalf && requesterMode === 'existing' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              พนักงานที่รับทรัพย์สิน <span className="text-red-600">*</span>
            </label>
            <Select searchable {...register('onBehalfOfEmployeeId')}>
              <option value="">เลือกพนักงาน</option>
              {allEmployees.map((e) => (
                <option key={e.employeeId} value={String(e.employeeId)}>
                  {/* Select อ่าน children เป็น string — ต้องประกอบเป็น string เดียว ไม่งั้นจะถูก join ด้วย comma */}
                  {[e.employeeCode, e.fullName, roleLabelByEmployeeId.get(e.employeeId)].filter(Boolean).join(' · ')}
                </option>
              ))}
            </Select>
            {errors.onBehalfOfEmployeeId && <p className="mt-1 text-xs text-red-600">{errors.onBehalfOfEmployeeId.message}</p>}
          </div>
        )}

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

      {canRequestOnBehalf && isNewEmployee && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">ข้อมูลพนักงานใหม่</p>
            <p className="text-xs text-slate-400">
              ระบบจะสร้างข้อมูลพนักงานให้พร้อมคำขอนี้ — เมื่อพนักงานได้อีเมลบริษัทแล้ว login ครั้งแรกและกรอกรหัสพนักงาน + ชื่อให้ตรงกับที่กรอกตรงนี้
              ระบบจะผูกบัญชีให้ และเห็นคำขอ/อุปกรณ์ของตัวเองทันที
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                รหัสพนักงาน <span className="text-red-600">*</span>
              </label>
              <Input {...register('newEmployee.employeeCode')} placeholder="EMP-0010" />
              {errors.newEmployee?.employeeCode && (
                <p className="mt-1 text-xs text-red-600">{errors.newEmployee.employeeCode.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                ชื่อ-นามสกุล <span className="text-red-600">*</span>
              </label>
              <Input {...register('newEmployee.fullName')} placeholder="สมชาย ใจดี" />
              {errors.newEmployee?.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.newEmployee.fullName.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">แผนก</label>
              <Select {...register('newEmployee.departmentId')}>
                <option value="">ไม่ระบุ</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">ตำแหน่ง</label>
              <Input {...register('newEmployee.position')} placeholder="Staff" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                อีเมลบริษัท (ถ้ามีแล้ว — มีแล้วระบบผูกบัญชีให้อัตโนมัติ)
              </label>
              <Input type="email" {...register('newEmployee.email')} placeholder="somchai.j@millimedthailand.com" />
              {errors.newEmployee?.email && <p className="mt-1 text-xs text-red-600">{errors.newEmployee.email.message}</p>}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            รายการทรัพย์สิน <span className="text-red-600">*</span>
          </label>
          <Button type="button" variant="secondary" size="sm" onClick={() => itemsArray.append({ assetId: undefined as unknown as number })}>
            <Plus size={14} /> เพิ่มรายการ
          </Button>
        </div>
        {defaultAssetUnavailable && (
          <p className="mb-2 text-xs text-red-600">
            ทรัพย์สินที่เลือกไว้ไม่พร้อมให้ทำรายการแล้ว (ไม่มีของว่างเหลือ) กรุณาเลือกรายการอื่น
          </p>
        )}
        {defaultAssetHrOnly && (
          <p className="mb-2 text-xs text-red-600">
            ทรัพย์สินที่เลือกไว้ต้องให้ HR เป็นผู้ทำรายการเบิก/ยืมให้ กรุณาติดต่อ HR
          </p>
        )}
        {hasHrOnlyAssets && (
          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            ต้องการ notebook / tablet? อุปกรณ์กลุ่มนี้ต้องให้ HR เป็นผู้ทำรายการเบิก/ยืมให้ กรุณาติดต่อ HR
          </div>
        )}
        <div className="space-y-2">
          {itemsArray.fields.map((field, idx) => {
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
                            {group.assets.map((a) => {
                              // ไม่ใช่ HR เห็นว่ามีของ แต่เลือกไม่ได้ — ต้องให้ HR ทำรายการให้ (backend ก็กันซ้ำ)
                              const hrOnly = !canRequestOnBehalf && requiresHrRequest(a)
                              const suffix = hrOnly ? ' (ติดต่อ HR)' : ''
                              return (
                                <option
                                  key={a.assetId}
                                  value={a.assetId}
                                  label={assetUnitTriggerLabel(a) + suffix}
                                  disabled={hrOnly}
                                >
                                  {assetUnitLabel(a) + suffix}
                                </option>
                              )
                            })}
                          </optgroup>
                        ))}
                      </Select>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => itemsArray.remove(idx)}
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {errors.items?.[idx]?.assetId && (
                  <p className="mt-1 text-xs text-red-600">{errors.items[idx]?.assetId?.message}</p>
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
            ลำดับผู้อนุมัติ (เรียงตามลำดับชั้น) {!autoApproved && <span className="text-red-600">*</span>}
          </label>
          {!autoApproved && (
            <Button type="button" variant="secondary" size="sm" onClick={() => approversArray.append({ employeeId: undefined })}>
              <Plus size={14} /> เพิ่มผู้อนุมัติ
            </Button>
          )}
        </div>
        {autoApproved ? (
          // it_admin อนุมัติใบของตัวเองไม่ได้ — backend อนุมัติให้ทันทีแทน (ดู RequisitionsService.create())
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            อนุมัติอัตโนมัติ — ผู้ขอหรือผู้รับทรัพย์สินเป็นผู้ดูแลระบบ IT จึงไม่ต้องรอการอนุมัติ
          </div>
        ) : (
          <>
            {itAdmins.length === 0 && (
              <p className="mb-2 text-xs text-red-600">ไม่พบผู้ดูแลระบบ IT ในระบบ กรุณาติดต่อผู้ดูแลระบบ</p>
            )}
            <div className="space-y-2">
              {approversArray.fields.map((field, idx) => (
                <div key={field.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-sm text-slate-400">{idx + 1}.</span>
                    <Select {...register(`approverIds.${idx}.employeeId` as const)} className="flex-1">
                      <option value="">เลือกผู้อนุมัติ (IT Admin)</option>
                      {itAdmins.map((e) => (
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
                  {errors.approverIds?.[idx]?.employeeId && (
                    <p className="mt-1 text-xs text-red-600">{errors.approverIds[idx]?.employeeId?.message}</p>
                  )}
                </div>
              ))}
            </div>
            {errors.approverIds?.message && <p className="mt-1 text-xs text-red-600">{errors.approverIds.message}</p>}
          </>
        )}
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

      <Modal open={!!previewValues} onClose={() => setPreviewValues(null)} title="ตัวอย่างใบส่งมอบ-ส่งคืนทรัพย์สิน" size="a4">
        {previewValues && (
          <div className="space-y-4">
            {/* แสดงเฉพาะแผ่นกระดาษ A4 — modal size="a4" กว้างพอดี 210mm บนจอปกติ, จอแคบกว่านั้นย่อทั้งแผ่นให้พอดีความกว้าง */}
            {(() => {
              const previewEmployee = effectiveEmployeeDefaults(previewValues)
              return (
                <HandoverDocumentPreview
                  requisitionNo={docNo ?? 'กำลังโหลด...'}
                  requestType={previewValues.requestType}
                  documentDate={new Date()}
                  employeeName={displayedRequesterName(previewValues)}
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
                  requestedByName={previewValues.requesterMode !== 'self' ? requestedByName : undefined}
                />
              )
            })()}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button type="button" variant="secondary" className="mr-auto" onClick={() => window.print()}>
                <Printer size={16} /> พิมพ์เอกสาร
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPreviewValues(null)}>
                แก้ไข
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  onSubmit(toDto(previewValues, isAutoApprovedFor(previewValues)))
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
