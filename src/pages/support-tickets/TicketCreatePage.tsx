import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ImagePlus, MapPin, X } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateSupportTicketMutation } from '@/hooks/useSupportTickets'
import { useMyAssignmentsQuery } from '@/hooks/useAssignments'
import { useAuthStore } from '@/stores/auth.store'
import { supportTicketsService } from '@/api/services/support-tickets.service'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { DeviceCombobox, type DeviceOption } from '@/components/support/DeviceCombobox'
import { AssignmentType, TicketCategory, TicketPriority } from '@/api/types/common.types'
import { TICKET_CATEGORY_LABEL, TICKET_PRIORITY_LABEL } from '@/lib/constants'
import { TICKET_CATEGORY_ICON } from '@/lib/supportTicket'
import { ACCEPTED_ATTACHMENT_TYPES } from '@/lib/attachmentTypes'
import { formatThaiDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  category: z.nativeEnum(TicketCategory, { message: 'กรุณาเลือกประเภทปัญหา' }),
  assetId: z.string().optional(),
  assetText: z.string().trim().max(200, 'ยาวได้ไม่เกิน 200 ตัวอักษร').optional(),
  locationDetail: z.string().trim().min(1, 'กรุณาระบุสถานที่ เพื่อให้ทีม IT ไปถูกที่').max(200, 'ยาวได้ไม่เกิน 200 ตัวอักษร'),
  subject: z.string().trim().min(1, 'กรุณากรอกเรื่องที่แจ้ง').max(200, 'ยาวได้ไม่เกิน 200 ตัวอักษร'),
  description: z.string().optional(),
  priority: z.nativeEnum(TicketPriority),
  contactPhone: z.string().trim().max(30, 'ยาวได้ไม่เกิน 30 ตัวอักษร').optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

const LABEL = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'

export function TicketCreatePage() {
  usePageTitle('แจ้งปัญหา IT')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const employee = user?.employee
  const create = useCreateSupportTicketMutation()
  const { data: myAssignments = [] } = useMyAssignmentsQuery()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // เปิดมาจากปุ่ม "แจ้งปัญหา" ในหน้ารายการของฉัน → เลือกอุปกรณ์ไว้ให้ + เดาประเภทเป็นฮาร์ดแวร์
  const presetAssetId = searchParams.get('assetId') ?? ''

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: presetAssetId ? TicketCategory.HARDWARE : undefined,
      assetId: presetAssetId,
      priority: TicketPriority.NORMAL,
      contactPhone: employee?.phone ?? '',
      assetText: '',
      locationDetail: '',
    },
  })

  const deviceOptions = useMemo<DeviceOption[]>(
    () =>
      myAssignments.map((a) => ({
        assetId: a.assetId,
        label: `${a.asset?.assetNo ?? `#${a.assetId}`} · ${a.asset?.assetName ?? ''}`.trim(),
        hint:
          a.assignmentType === AssignmentType.TEMPORARY_LOAN
            ? `ของยืม${a.dueDate ? ` · คืน ${formatThaiDate(a.dueDate)}` : ''}`
            : undefined,
      })),
    [myAssignments],
  )

  // เปิดมาพร้อม ?assetId= แต่รายการของที่ถืออยู่โหลดทีหลัง — เติมชื่ออุปกรณ์ในช่องตอนข้อมูลมาถึง
  useEffect(() => {
    const preset = deviceOptions.find((o) => String(o.assetId) === presetAssetId)
    if (preset) setValue('assetText', preset.label)
  }, [deviceOptions, presetAssetId, setValue])

  if (!user?.employeeId) {
    return <EmptyState message="บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน จึงแจ้งปัญหาไม่ได้" />
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const accepted = Array.from(list).filter((f) => ACCEPTED_ATTACHMENT_TYPES.includes(f.type))
    if (accepted.length < list.length) toast.error('รองรับเฉพาะไฟล์ jpg, png, webp หรือ pdf')
    setFiles((prev) => [...prev, ...accepted])
  }

  function onSubmit(values: FormValues) {
    create.mutate(
      {
        category: values.category,
        subject: values.subject,
        description: values.description || undefined,
        priority: values.priority,
        assetId: values.assetId ? Number(values.assetId) : undefined,
        assetText: values.assetId ? undefined : values.assetText || undefined,
        locationDetail: values.locationDetail,
        contactPhone: values.contactPhone || undefined,
      },
      {
        onSuccess: async (ticket) => {
          // รูปอัปโหลดหลังสร้าง ticket ได้ id แล้วเท่านั้น — อัปไม่ผ่านไม่ถือว่าแจ้งไม่สำเร็จ แนบเพิ่มในหน้ารายละเอียดได้
          if (files.length) {
            setIsUploading(true)
            const results = await Promise.allSettled(files.map((f) => supportTicketsService.uploadAttachment(ticket.ticketId, f)))
            setIsUploading(false)
            if (results.some((r) => r.status === 'rejected')) {
              toast.warning('แนบรูปบางไฟล์ไม่สำเร็จ — แนบเพิ่มได้ในหน้ารายละเอียด')
            }
          }
          toast.success(`ส่งเรื่องแล้ว เลขที่ ${ticket.ticketNo}`)
          navigate(`/support-tickets/${ticket.ticketId}`, { replace: true })
        },
        onError: (error) => toast.error(getErrorMessage(error, 'ส่งเรื่องไม่สำเร็จ')),
      },
    )
  }

  const isSubmitting = create.isPending || isUploading
  // ช่องบังคับครบหรือยัง ไว้ disable ปุ่มส่ง — กฎอื่น (เช่นความยาว) ยังให้ zodResolver เช็คตอน submit
  const [category, locationDetail, subject, assetId, assetText] = watch(['category', 'locationDetail', 'subject', 'assetId', 'assetText'])
  const isFormComplete = !!category && !!locationDetail?.trim() && !!subject?.trim()

  return (
    <div>
      <BackLink />
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">ข้อมูลผู้แจ้ง</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 dark:bg-slate-800/50">
              <ReadOnlyField label="ชื่อ-สกุล" value={employee?.fullName ?? user.fullName} />
              <ReadOnlyField label="แผนก" value={employee?.department?.departmentName} />
              <ReadOnlyField label="ฝ่าย" value={employee?.department?.parentDepartmentName} />
              <div>
                <label htmlFor="contactPhone" className="text-slate-400">
                  เบอร์โทรติดต่อกลับ
                </label>
                <Input id="contactPhone" type="tel" inputMode="tel" className="mt-1 bg-white" {...register('contactPhone')} placeholder="08x-xxx-xxxx" />
                {errors.contactPhone && <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>}
              </div>
            </dl>
          </section>

          <section>
            <span className={LABEL}>
              ประเภทปัญหา <span className="text-red-500">*</span>
            </span>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.values(TicketCategory).map((c) => {
                    const Icon = TICKET_CATEGORY_ICON[c]
                    const selected = field.value === c
                    return (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => field.onChange(c)}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors duration-200',
                          selected
                            ? 'border-brand-500 bg-brand-50 font-medium text-brand-700 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                        )}
                      >
                        <Icon size={18} className="shrink-0" />
                        {TICKET_CATEGORY_LABEL[c]}
                      </button>
                    )
                  })}
                </div>
              )}
            />
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
          </section>

          <section>
            <label htmlFor="device" className={LABEL}>
              อุปกรณ์ที่มีปัญหา <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
            </label>
            <DeviceCombobox
              id="device"
              options={deviceOptions}
              assetId={assetId ? Number(assetId) : undefined}
              text={assetText ?? ''}
              onChange={(v) => {
                setValue('assetId', v.assetId ? String(v.assetId) : '')
                setValue('assetText', v.text, { shouldValidate: !!errors.assetText })
              }}
              placeholder={deviceOptions.length ? 'พิมพ์ชื่ออุปกรณ์ หรือเลือกจากของที่คุณเบิก/ยืมอยู่' : 'พิมพ์ชื่ออุปกรณ์ เช่น ปริ้นเตอร์ชั้น 3'}
            />
            {errors.assetText && <p className="mt-1 text-xs text-red-600">{errors.assetText.message}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {deviceOptions.length ? 'กดที่ช่องเพื่อเลือกของที่คุณเบิก/ยืมอยู่ หรือพิมพ์ชื่ออุปกรณ์อื่นเองได้' : 'พิมพ์ชื่ออุปกรณ์ที่มีปัญหา หรือเว้นว่างถ้าไม่เกี่ยวกับอุปกรณ์'}
            </p>
          </section>

          <section>
            <label htmlFor="locationDetail" className={cn(LABEL, 'inline-flex items-center gap-1.5')}>
              <MapPin size={15} /> สถานที่ที่ให้ทีม IT ไปหา <span className="text-red-500">*</span>
            </label>
            <Input id="locationDetail" {...register('locationDetail')} placeholder="เช่น อาคาร A ชั้น 3 ห้องบัญชี โต๊ะริมหน้าต่าง" />
            {errors.locationDetail && <p className="mt-1 text-xs text-red-600">{errors.locationDetail.message}</p>}
          </section>

          <section className="space-y-4">
            <div>
              <label htmlFor="subject" className={LABEL}>
                เรื่องที่แจ้ง <span className="text-red-500">*</span>
              </label>
              <Input id="subject" {...register('subject')} placeholder="เช่น โน้ตบุ๊กเปิดไม่ติด, สาย HDMI เสียบไม่เข้า" />
              {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
            </div>
            <div>
              <label htmlFor="description" className={LABEL}>
                รายละเอียด
              </label>
              <Textarea id="description" rows={4} {...register('description')} placeholder="อาการที่พบ เกิดขึ้นตั้งแต่เมื่อไหร่ ลองทำอะไรไปแล้วบ้าง" />
            </div>
          </section>

          <section>
            <span className={LABEL}>ความเร่งด่วน</span>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <div role="radiogroup" className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  {Object.values(TicketPriority).map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={field.value === p}
                      onClick={() => field.onChange(p)}
                      className={cn(
                        'rounded-lg px-4 py-1.5 text-sm transition-colors duration-200',
                        field.value === p
                          ? cn(
                              'bg-white font-medium shadow-sm dark:bg-slate-900',
                              p === TicketPriority.URGENT ? 'text-red-600 dark:text-red-400' : p === TicketPriority.HIGH ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-100',
                            )
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                      )}
                    >
                      {TICKET_PRIORITY_LABEL[p]}
                    </button>
                  ))}
                </div>
              )}
            />
          </section>

          <section>
            <span className={LABEL}>
              แนบรูป <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={`${f.name}-${i}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 py-1 pl-3 pr-1 text-sm dark:bg-slate-800">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`ลบ ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 dark:border-slate-600 dark:text-slate-400">
                <ImagePlus size={16} /> เพิ่มรูป
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_ATTACHMENT_TYPES.join(',')}
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {!isFormComplete && <p className="mr-auto text-sm text-slate-500 dark:text-slate-400">กรอกช่องที่มี * ให้ครบก่อน จึงจะส่งเรื่องได้</p>}
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isFormComplete}>
              {isUploading ? 'กำลังอัปโหลดรูป...' : create.isPending ? 'กำลังส่ง...' : 'ส่งเรื่องแจ้ง'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-700 dark:text-slate-200">{value || '—'}</dd>
    </div>
  )
}
