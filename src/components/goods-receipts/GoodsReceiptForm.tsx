import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useAssetCategoriesQuery, useLocationsQuery } from '@/hooks/useMasterData'
import { usePurchaseOrdersQuery } from '@/hooks/usePurchaseOrders'
import { optionalDateString, optionalNonNegativeNumber, optionalPositiveInt } from '@/lib/zodHelpers'
import type { CreateGoodsReceiptDto } from '@/api/types/goods-receipt.types'

const itemSchema = z.object({
  poItemId: optionalPositiveInt(),
  categoryId: z.coerce.number().int().positive('กรุณาเลือกหมวดหมู่'),
  assetName: z.string().min(1, 'กรุณากรอกชื่อทรัพย์สิน'),
  serialNumber: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  purchaseCost: optionalNonNegativeNumber(),
  warrantyExpireDate: optionalDateString(),
  conditionOnReceipt: z.string().optional(),
})

const formSchema = z.object({
  receiptNo: z.string().min(1, 'กรุณากรอกเลขที่ใบรับของ'),
  poId: optionalPositiveInt(),
  receiptDate: optionalDateString(),
  locationId: z.coerce.number().int().positive('กรุณาเลือกสถานที่'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ'),
})

export type GoodsReceiptFormValues = z.output<typeof formSchema>
type GoodsReceiptFormInput = z.input<typeof formSchema>

interface GoodsReceiptFormProps {
  onSubmit: (dto: CreateGoodsReceiptDto) => void
  isSubmitting?: boolean
}

export function GoodsReceiptForm({ onSubmit, isSubmitting }: GoodsReceiptFormProps) {
  const { data: locations = [] } = useLocationsQuery()
  const { data: categories = [] } = useAssetCategoriesQuery()
  const { data: purchaseOrders = [] } = usePurchaseOrdersQuery()

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<GoodsReceiptFormInput, unknown, GoodsReceiptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiptNo: '',
      items: [{ assetName: '' }],
    },
  })

  const itemsArray = useFieldArray({ control, name: 'items' })
  const selectedPoId = watch('poId')
  const selectedPo = purchaseOrders.find((po) => po.poId === Number(selectedPoId))
  const poItems = selectedPo?.items ?? []

  function submit(values: GoodsReceiptFormValues) {
    onSubmit({
      receiptNo: values.receiptNo,
      poId: values.poId,
      receiptDate: values.receiptDate || undefined,
      locationId: values.locationId,
      notes: values.notes,
      items: values.items.map((i) => ({
        poItemId: i.poItemId,
        conditionOnReceipt: i.conditionOnReceipt,
        assetData: {
          categoryId: i.categoryId,
          assetName: i.assetName,
          serialNumber: i.serialNumber,
          brand: i.brand,
          model: i.model,
          purchaseCost: i.purchaseCost,
          warrantyExpireDate: i.warrantyExpireDate,
        },
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เลขที่ใบรับของ</label>
          <Input {...register('receiptNo')} placeholder="GR-2026-0001" />
          {errors.receiptNo && <p className="mt-1 text-xs text-red-600">{errors.receiptNo.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            อ้างอิงใบสั่งซื้อ (ถ้ามี)
          </label>
          <Select {...register('poId')}>
            <option value="">ไม่อ้างอิง</option>
            {purchaseOrders.map((po) => (
              <option key={po.poId} value={po.poId}>
                {po.poNo}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">สถานที่รับเข้า</label>
          <Select {...register('locationId')}>
            <option value="">เลือกสถานที่</option>
            {locations.map((l) => (
              <option key={l.locationId} value={l.locationId}>
                {l.locationName}
              </option>
            ))}
          </Select>
          {errors.locationId && <p className="mt-1 text-xs text-red-600">{errors.locationId.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่รับของ</label>
          <Input type="date" {...register('receiptDate')} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมายเหตุ</label>
        <Textarea rows={2} {...register('notes')} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            รายการทรัพย์สินที่รับเข้า (ลงทะเบียนเป็นทรัพย์สินใหม่)
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => itemsArray.append({ assetName: '', categoryId: undefined as unknown as number })}
          >
            <Plus size={14} /> เพิ่มรายการ
          </Button>
        </div>
        <div className="space-y-3">
          {itemsArray.fields.map((field, idx) => (
            <div key={field.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">รายการที่ {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => itemsArray.remove(idx)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {poItems.length > 0 && (
                  <Select {...register(`items.${idx}.poItemId` as const)} className="sm:col-span-3">
                    <option value="">ไม่อ้างอิงรายการใน PO</option>
                    {poItems.map((pi) => (
                      <option key={pi.poItemId} value={pi.poItemId}>
                        {pi.itemDescription} ({pi.receivedQuantity}/{pi.quantity})
                      </option>
                    ))}
                  </Select>
                )}
                <div>
                  <Input {...register(`items.${idx}.assetName` as const)} placeholder="ชื่อทรัพย์สิน" />
                  {errors.items?.[idx]?.assetName && (
                    <p className="mt-1 text-xs text-red-600">{errors.items[idx]?.assetName?.message}</p>
                  )}
                </div>
                <div>
                  <Select {...register(`items.${idx}.categoryId` as const)}>
                    <option value="">หมวดหมู่</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                  </Select>
                  {errors.items?.[idx]?.categoryId && (
                    <p className="mt-1 text-xs text-red-600">{errors.items[idx]?.categoryId?.message}</p>
                  )}
                </div>
                <Input {...register(`items.${idx}.serialNumber` as const)} placeholder="Serial Number" />
                <Input {...register(`items.${idx}.brand` as const)} placeholder="ยี่ห้อ" />
                <Input {...register(`items.${idx}.model` as const)} placeholder="รุ่น" />
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register(`items.${idx}.purchaseCost` as const)}
                  placeholder="มูลค่า (บาท)"
                />
                <Input type="date" {...register(`items.${idx}.warrantyExpireDate` as const)} placeholder="วันหมดประกัน" />
                <Input {...register(`items.${idx}.conditionOnReceipt` as const)} placeholder="สภาพสินค้าเมื่อรับ" />
              </div>
            </div>
          ))}
        </div>
        {errors.items && !Array.isArray(errors.items) && (
          <p className="mt-1 text-xs text-red-600">{errors.items.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกใบรับของ'}
      </Button>
    </form>
  )
}
