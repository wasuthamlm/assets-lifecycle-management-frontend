import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useEmployeesQuery } from '@/hooks/useEmployees'
import { useAssetCategoriesQuery, useVendorsQuery } from '@/hooks/useMasterData'
import type { CreatePurchaseOrderDto } from '@/api/types/purchase-order.types'

const itemSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  itemDescription: z.string().min(1, 'กรุณากรอกรายละเอียดสินค้า'),
  quantity: z.coerce.number().int().positive('จำนวนต้องมากกว่า 0'),
  unitPrice: z.coerce.number().nonnegative().optional(),
})

const formSchema = z.object({
  poNo: z.string().min(1, 'กรุณากรอกเลขที่ใบสั่งซื้อ'),
  vendorId: z.coerce.number().int().positive('กรุณาเลือกผู้ขาย'),
  orderDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  requestedBy: z.coerce.number().int().positive('กรุณาเลือกผู้ขอซื้อ'),
  items: z.array(itemSchema).min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ'),
})

export type PurchaseOrderFormValues = z.output<typeof formSchema>
type PurchaseOrderFormInput = z.input<typeof formSchema>

interface PurchaseOrderFormProps {
  defaultRequestedBy?: number
  onSubmit: (dto: CreatePurchaseOrderDto) => void
  isSubmitting?: boolean
}

export function PurchaseOrderForm({ defaultRequestedBy, onSubmit, isSubmitting }: PurchaseOrderFormProps) {
  const { data: employees = [] } = useEmployeesQuery()
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
      poNo: '',
      requestedBy: defaultRequestedBy,
      items: [{ itemDescription: '', quantity: 1 }],
    },
  })

  const itemsArray = useFieldArray({ control, name: 'items' })

  function submit(values: PurchaseOrderFormValues) {
    onSubmit({
      poNo: values.poNo,
      vendorId: values.vendorId,
      orderDate: values.orderDate || undefined,
      expectedDeliveryDate: values.expectedDeliveryDate || undefined,
      requestedBy: values.requestedBy,
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
          <Input {...register('poNo')} placeholder="PO-2026-0001" />
          {errors.poNo && <p className="mt-1 text-xs text-red-600">{errors.poNo.message}</p>}
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
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้ขอซื้อ</label>
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
