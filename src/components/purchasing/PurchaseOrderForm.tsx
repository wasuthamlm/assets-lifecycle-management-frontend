import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAssetCategoriesQuery, useVendorsQuery } from '@/hooks/useMasterData'
import { optionalDateString, optionalNonNegativeNumber, optionalPositiveInt } from '@/lib/zodHelpers'
import type { CreatePurchaseOrderDto } from '@/api/types/purchase-order.types'

const itemSchema = z.object({
  categoryId: optionalPositiveInt(),
  itemDescription: z.string().min(1, 'กรุณากรอกรายละเอียดสินค้า'),
  quantity: z.coerce.number().int().positive('จำนวนต้องมากกว่า 0'),
  unitPrice: optionalNonNegativeNumber(),
})

const formSchema = z.object({
  vendorId: z.coerce.number().int().positive('กรุณาเลือกผู้ขาย'),
  orderDate: optionalDateString(),
  expectedDeliveryDate: optionalDateString(),
  items: z.array(itemSchema).min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ'),
})

export type PurchaseOrderFormValues = z.output<typeof formSchema>
type PurchaseOrderFormInput = z.input<typeof formSchema>

interface PurchaseOrderFormProps {
  defaultDocNo?: string
  onSubmit: (dto: CreatePurchaseOrderDto) => void
  isSubmitting?: boolean
}

export function PurchaseOrderForm({ defaultDocNo, onSubmit, isSubmitting }: PurchaseOrderFormProps) {
  const { data: vendors = [] } = useVendorsQuery()
  const { data: categories = [] } = useAssetCategoriesQuery()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseOrderFormInput, unknown, PurchaseOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ itemDescription: '', quantity: 1 }],
    },
  })

  const itemsArray = useFieldArray({ control, name: 'items' })

  function submit(values: PurchaseOrderFormValues) {
    onSubmit({
      vendorId: values.vendorId,
      orderDate: values.orderDate || undefined,
      expectedDeliveryDate: values.expectedDeliveryDate || undefined,
      items: values.items.map((i) => ({
        categoryId: i.categoryId,
        itemDescription: i.itemDescription,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เลขที่ใบสั่งซื้อ</label>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="font-mono text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-400">
              {defaultDocNo ?? '—'}
            </span>
            <span className="text-xs text-slate-400">ระบบสร้างให้อัตโนมัติ</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้ขาย</label>
          <Select {...register('vendorId')}>
            <option value="">เลือกผู้ขาย</option>
            {vendors.map((v) => (
              <option key={v.vendorId} value={v.vendorId}>
                {v.vendorName}
              </option>
            ))}
          </Select>
          {errors.vendorId && <p className="mt-1 text-xs text-red-600">{errors.vendorId.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่สั่งซื้อ</label>
          <Input type="date" {...register('orderDate')} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่คาดว่าจะได้รับ</label>
          <Input type="date" {...register('expectedDeliveryDate')} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">รายการสินค้า</label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => itemsArray.append({ itemDescription: '', quantity: 1 })}
          >
            <Plus size={14} /> เพิ่มรายการ
          </Button>
        </div>
        <div className="space-y-2">
          {itemsArray.fields.map((field, idx) => (
            <div key={field.id} className="flex items-start gap-2">
              <Select {...register(`items.${idx}.categoryId` as const)} className="w-40 shrink-0">
                <option value="">หมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </Select>
              <div className="flex-1">
                <Input {...register(`items.${idx}.itemDescription` as const)} placeholder="รายละเอียดสินค้า" />
                {errors.items?.[idx]?.itemDescription && (
                  <p className="mt-1 text-xs text-red-600">{errors.items[idx]?.itemDescription?.message}</p>
                )}
              </div>
              <Input
                type="number"
                min={1}
                placeholder="จำนวน"
                className="w-24"
                {...register(`items.${idx}.quantity` as const)}
              />
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="ราคา/หน่วย"
                className="w-28"
                {...register(`items.${idx}.unitPrice` as const)}
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
        {errors.items && !Array.isArray(errors.items) && (
          <p className="mt-1 text-xs text-red-600">{errors.items.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกใบสั่งซื้อ'}
      </Button>
    </form>
  )
}
