import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Image as ImageIcon, X } from 'lucide-react'
import { useAssetCategoriesQuery, useCreateAssetCategoryMutation, useVendorsQuery, useLocationsQuery } from '@/hooks/useMasterData'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { optionalDateString, optionalNonNegativeNumber, optionalPositiveInt } from '@/lib/zodHelpers'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'

// รองรับเฉพาะรูปภาพ (ไม่รวม PDF เหมือน AttachmentGrid ทั่วไป) เพราะช่องนี้เจาะจงไว้สำหรับ "รูปทรัพย์สิน"
// ตอนสร้างใหม่โดยเฉพาะ — ไฟล์เอกสารอื่นแนบเพิ่มทีหลังได้ผ่าน AttachmentsPanel ที่หน้ารายละเอียด
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

function resolveImageMimeType(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }
  return (ext && map[ext]) || ''
}

const formSchema = z.object({
  assetName: z.string().min(1, 'กรุณากรอกชื่อทรัพย์สิน'),
  serialNumber: z.string().min(1, 'กรุณากรอก Serial Number'),
  brand: z.string().min(1, 'กรุณากรอกยี่ห้อ'),
  model: z.string().min(1, 'กรุณากรอกรุ่น'),
  vendorId: optionalPositiveInt(),
  purchaseDate: optionalDateString(),
  purchaseCost: optionalNonNegativeNumber(),
  warrantyExpireDate: optionalDateString(),
  currentLocationId: optionalPositiveInt(),
  notes: z.string().optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export interface AssetFormInitial {
  assetName: string
  serialNumber: string | null
  brand: string | null
  model: string | null
  vendorId: number | null
  purchaseDate: string | null
  purchaseCost: number | null
  warrantyExpireDate: string | null
  currentLocationId: number | null
  notes: string | null
  /** หมวดหมู่หลักที่เลือกไว้จริง (parent ถ้ามี ไม่งั้นใช้ category ตัวมันเองเพราะเป็นหมวดหมู่หลักอยู่แล้ว) */
  mainCategoryId: number | null
  /** หมวดหมู่ย่อยที่เลือกไว้จริง — มีค่าเฉพาะตอนที่ category มี parent เท่านั้น (ดู AssetsListPage: mainCategoryName/subCategoryName) */
  subCategoryId: number | null
}

interface AssetFormProps {
  initial?: AssetFormInitial
  submitLabel: string
  submitPendingLabel: string
  isSubmitting: boolean
  /** imageFiles มีค่าเฉพาะตอนสร้างใหม่ (ไม่มี initial) — ผู้เรียกเป็นคนอัปโหลดเองหลังสร้างทรัพย์สินสำเร็จ
   * ได้ assetId มาแล้ว (ดู AssetCreatePage) เพราะ endpoint แนบไฟล์ต้องมี referenceId ของที่มีอยู่จริงก่อน */
  onSubmit: (values: FormValues & { categoryId: number }, imageFiles: File[]) => void
}

/** ฟอร์มกรอกข้อมูลทรัพย์สิน ใช้ร่วมกันทั้งตอนสร้างใหม่ (AssetCreatePage) และแก้ไข (AssetEditPage) —
 * ต่างกันแค่ initial values กับปลายทางตอน submit (create vs update) ผู้เรียกเป็นคนตัดสินใจเอง */
export function AssetForm({ initial, submitLabel, submitPendingLabel, isSubmitting, onSubmit }: AssetFormProps) {
  const createCategory = useCreateAssetCategoryMutation()
  const { data: categories = [] } = useAssetCategoriesQuery()
  const { data: vendors = [] } = useVendorsQuery()
  const { data: locations = [] } = useLocationsQuery()

  const [mainCategoryId, setMainCategoryId] = useState(initial?.mainCategoryId ? String(initial.mainCategoryId) : '')
  const [subCategoryId, setSubCategoryId] = useState(initial?.subCategoryId ? String(initial.subCategoryId) : '')
  const [categoryError, setCategoryError] = useState('')
  const [newCategoryModal, setNewCategoryModal] = useState<'main' | 'sub' | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const imageDragCounter = useRef(0)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // สร้าง object URL ใหม่ทุกครั้งที่ imageFiles เปลี่ยน (reference ใหม่) — useEffect ด้านล่าง revoke
  // ชุดก่อนหน้าให้เองตอน cleanup (React รัน cleanup ของ effect เก่าก่อนรัน effect ใหม่เสมอ) กัน object URL ค้าง memory
  const imagePreviews = useMemo(
    () => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [imageFiles],
  )
  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [imagePreviews])

  function addImageFiles(files: File[]) {
    const valid: File[] = []
    for (const file of files) {
      const mimeType = resolveImageMimeType(file)
      if (!ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
        toast.error(`ไม่รองรับไฟล์ "${file.name}" (รองรับเฉพาะ PNG, JPEG, WebP)`)
        continue
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`ไฟล์ "${file.name}" ใหญ่เกินไป (จำกัดไม่เกิน 10 MB)`)
        continue
      }
      valid.push(file.type ? file : new File([file], file.name, { type: mimeType }))
    }
    if (valid.length > 0) setImageFiles((prev) => [...prev, ...valid])
  }

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length > 0) addImageFiles(files)
  }

  function removeImageAt(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleImageDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    imageDragCounter.current = 0
    setIsDraggingImage(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) addImageFiles(files)
  }

  function handleImageDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleImageDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    imageDragCounter.current += 1
    setIsDraggingImage(true)
  }

  function handleImageDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    imageDragCounter.current -= 1
    if (imageDragCounter.current <= 0) {
      imageDragCounter.current = 0
      setIsDraggingImage(false)
    }
  }

  const mainCategories = categories.filter((c) => !c.parentCategoryId)
  const subCategories = categories.filter((c) => c.parentCategoryId === Number(mainCategoryId))

  function handleMainCategoryChange(value: string) {
    setMainCategoryId(value)
    setSubCategoryId('')
  }

  function openNewCategoryModal(kind: 'main' | 'sub') {
    setNewCategoryName('')
    setNewCategoryModal(kind)
  }

  function confirmNewCategory() {
    if (!newCategoryName.trim()) {
      toast.error('กรอกชื่อหมวดหมู่ใหม่')
      return
    }
    createCategory.mutate(
      {
        categoryName: newCategoryName.trim(),
        parentCategoryId: newCategoryModal === 'sub' ? Number(mainCategoryId) : undefined,
      },
      {
        onSuccess: (created) => {
          toast.success('เพิ่มหมวดหมู่ใหม่เรียบร้อยแล้ว')
          if (newCategoryModal === 'main') {
            setMainCategoryId(String(created.categoryId))
            setSubCategoryId('')
          } else {
            setSubCategoryId(String(created.categoryId))
          }
          setNewCategoryModal(null)
        },
        onError: (e) => toast.error(getErrorMessage(e, 'เพิ่มหมวดหมู่ไม่สำเร็จ')),
      },
    )
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          assetName: initial.assetName,
          serialNumber: initial.serialNumber ?? '',
          brand: initial.brand ?? '',
          model: initial.model ?? '',
          vendorId: initial.vendorId ?? undefined,
          purchaseDate: initial.purchaseDate ?? undefined,
          purchaseCost: initial.purchaseCost ?? undefined,
          warrantyExpireDate: initial.warrantyExpireDate ?? undefined,
          currentLocationId: initial.currentLocationId ?? undefined,
          notes: initial.notes ?? '',
        }
      : undefined,
  })

  function handleFormSubmit(values: FormValues) {
    if (!mainCategoryId) {
      setCategoryError('กรุณาเลือกหมวดหมู่หลัก')
      return
    }
    // หมวดหมู่ย่อยไม่บังคับเลือก/สร้าง แม้จะมีหมวดหมู่ย่อยให้เลือกอยู่ก็ตาม — ถ้าชื่อหมวดหมู่หลักสื่อความหมายพอแล้ว
    // ไม่จำเป็นต้องแยกย่อยอีกชั้น ปล่อยว่างได้ ระบบจะใช้หมวดหมู่หลักเป็น categoryId ของทรัพย์สินแทน
    const categoryId = subCategoryId || mainCategoryId
    setCategoryError('')
    onSubmit({ ...values, categoryId: Number(categoryId) }, imageFiles)
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อทรัพย์สิน <span className="text-red-600">*</span></label>
              <Input {...register('assetName')} placeholder="Notebook Dell Latitude" />
              {errors.assetName && <p className="mt-1 text-xs text-red-600">{errors.assetName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมวดหมู่หลัก <span className="text-red-600">*</span></label>
              <div className="flex gap-2">
                <Select value={mainCategoryId} onChange={(e) => handleMainCategoryChange(e.target.value)} className="flex-1">
                  <option value="">เลือกหมวดหมู่หลัก</option>
                  {mainCategories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 px-3"
                  onClick={() => openNewCategoryModal('main')}
                  aria-label="เพิ่มหมวดหมู่หลักใหม่"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมวดหมู่ย่อย (ไม่บังคับ)</label>
              <div className="flex gap-2">
                <Select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} className="flex-1">
                  {mainCategoryId ? (
                    subCategories.length > 0 ? (
                      <>
                        <option value="">ไม่ระบุ — ใช้หมวดหมู่หลักเลย</option>
                        {subCategories.map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>
                            {c.categoryName}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="">ไม่มีหมวดหมู่ย่อย — ใช้หมวดหมู่หลักเลย</option>
                    )
                  ) : (
                    <option value="">เลือกหมวดหมู่หลักก่อน</option>
                  )}
                </Select>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 px-3"
                  onClick={() => openNewCategoryModal('sub')}
                  disabled={!mainCategoryId}
                  title={!mainCategoryId ? 'เลือกหมวดหมู่หลักก่อน' : undefined}
                  aria-label="เพิ่มหมวดหมู่ย่อยใหม่"
                >
                  <Plus size={16} />
                </Button>
              </div>
              {categoryError && <p className="mt-1 text-xs text-red-600">{categoryError}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Serial Number <span className="text-red-600">*</span></label>
              <Input {...register('serialNumber')} />
              {errors.serialNumber && <p className="mt-1 text-xs text-red-600">{errors.serialNumber.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ยี่ห้อ <span className="text-red-600">*</span></label>
              <Input {...register('brand')} />
              {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รุ่น <span className="text-red-600">*</span></label>
              <Input {...register('model')} />
              {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้ขาย</label>
              <Select {...register('vendorId')}>
                <option value="">ไม่ระบุ</option>
                {vendors.map((v) => (
                  <option key={v.vendorId} value={v.vendorId}>
                    {v.vendorName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่ซื้อ</label>
              <Input type="date" {...register('purchaseDate')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">มูลค่า (บาท)</label>
              <Input type="number" step="0.01" {...register('purchaseCost')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันหมดประกัน</label>
              <Input type="date" {...register('warrantyExpireDate')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">สถานที่ปัจจุบัน</label>
              <Select {...register('currentLocationId')}>
                <option value="">ไม่ระบุ</option>
                {locations.map((l) => (
                  <option key={l.locationId} value={l.locationId}>
                    {l.locationName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมายเหตุ</label>
            <Textarea rows={3} {...register('notes')} />
          </div>

          {/* เฉพาะตอนสร้างใหม่เท่านั้น (ไม่มี initial) — ตอนแก้ไขจัดการรูป/ไฟล์แนบผ่าน AttachmentsPanel
              ที่หน้ารายละเอียดแทน กันไม่ให้มี 2 ทางอัปโหลดที่ทำงานคนละแบบซ้อนกันในฟอร์มเดียว */}
          {!initial && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รูปภาพทรัพย์สิน</label>
              <input
                ref={imageInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={handleImageInputChange}
              />
              <div
                onDragEnter={handleImageDragEnter}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                onClick={() => imageInputRef.current?.click()}
                className={cn(
                  'flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-4 text-center text-sm text-slate-400 transition-colors',
                  isDraggingImage
                    ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-500/5'
                    : 'border-slate-200 dark:border-slate-700',
                )}
              >
                <ImageIcon size={20} />
                <span>ลากรูปมาวาง หรือ กดเพื่อเลือกไฟล์ (เลือกได้หลายรูป)</span>
              </div>
              {imagePreviews.length > 0 && (
                <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {imagePreviews.map((p, idx) => (
                    <li key={`${p.file.name}-${idx}`} className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                      <img src={p.url} alt={p.file.name} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImageAt(idx)
                        }}
                        className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1 text-slate-500 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100 dark:bg-slate-900/90"
                        aria-label={`เอารูป ${p.file.name} ออก`}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs text-slate-400">ไม่บังคับ — รองรับ PNG, JPEG, WebP ไม่เกิน 10 MB ต่อไฟล์</p>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? submitPendingLabel : submitLabel}
          </Button>
        </form>
      </Card>

      <Modal
        open={newCategoryModal !== null}
        onClose={() => setNewCategoryModal(null)}
        title={newCategoryModal === 'sub' ? 'เพิ่มหมวดหมู่ย่อยใหม่' : 'เพิ่มหมวดหมู่หลักใหม่'}
      >
        <div className="space-y-4">
          {newCategoryModal === 'sub' && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              จะเพิ่มเป็นหมวดหมู่ย่อยของ{' '}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {mainCategories.find((c) => String(c.categoryId) === mainCategoryId)?.categoryName}
              </span>
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อหมวดหมู่</label>
            <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="เช่น อุปกรณ์คอมพิวเตอร์" autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setNewCategoryModal(null)}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={confirmNewCategory} disabled={createCategory.isPending}>
              {createCategory.isPending ? 'กำลังบันทึก...' : 'ยืนยันเพิ่ม'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
