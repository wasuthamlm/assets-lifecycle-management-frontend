import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAssetCategoriesQuery, useCreateVendorMutation, useVendorsQuery } from '@/hooks/useMasterData'
import { usePermission } from '@/hooks/usePermission'
import { optionalDateString, optionalNonNegativeNumber, optionalPositiveInt } from '@/lib/zodHelpers'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CreatePurchaseOrderDto } from '@/api/types/purchase-order.types'

const itemSchema = z.object({
  categoryId: optionalPositiveInt(),
  itemDescription: z.string().min(1, 'กรุณากรอกรายการ'),
  quantity: z.coerce.number().int().positive('กรุณากรอกจำนวน'),
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
  onSubmit: (dto: CreatePurchaseOrderDto) => void
  isSubmitting?: boolean
}

export function PurchaseOrderForm({ onSubmit, isSubmitting }: PurchaseOrderFormProps) {
  const { data: vendors = [] } = useVendorsQuery()
  const { data: categories = [] } = useAssetCategoriesQuery()
  const { hasPermission } = usePermission()
  const createVendor = useCreateVendorMutation()
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormInput, unknown, PurchaseOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ itemDescription: '', quantity: 1 }],
    },
  })

  const itemsArray = useFieldArray({ control, name: 'items' })

  function handleAddVendor() {
    if (!newVendorName.trim()) {
      toast.error('กรุณากรอกชื่อผู้ขาย')
      return
    }
    createVendor.mutate(
      { vendorName: newVendorName.trim() },
      {
        onSuccess: (vendor) => {
          toast.success('เพิ่มผู้ขายเรียบร้อยแล้ว')
          setValue('vendorId', vendor.vendorId, { shouldValidate: true })
          setNewVendorName('')
          setShowNewVendor(false)
        },
        onError: (error) => toast.error(getErrorMessage(error, 'เพิ่มผู้ขายไม่สำเร็จ')),
      },
    )
  }

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
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              ผู้ขาย <span className="text-red-600">*</span>
            </label>
            {hasPermission('master.manage') && (
              <button
                type="button"
                onClick={() => setShowNewVendor((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {showNewVendor ? (
                  <>
                    <X size={12} /> ยกเลิก
                  </>
                ) : (
                  <>
                    <Plus size={12} /> เพิ่มผู้ขายใหม่
                  </>
                )}
              </button>
            )}
          </div>
          {showNewVendor ? (
            <div className="flex gap-2">
              <Input
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVendor())}
                placeholder="ชื่อผู้ขายใหม่"
                autoFocus
              />
              <Button type="button" size="sm" onClick={handleAddVendor} disabled={createVendor.isPending}>
                บันทึก
              </Button>
            </div>
          ) : (
            <>
              <Select {...register('vendorId')}>
                <option value="">เลือกผู้ขาย</option>
                {vendors.map((v) => (
                  <option key={v.vendorId} value={v.vendorId}>
                    {v.vendorName}
                  </option>
                ))}
              </Select>
              {errors.vendorId && <p className="mt-1 text-xs text-red-600">{errors.vendorId.message}</p>}
            </>
          )}
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">รายการสั่งซื้อ</label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => itemsArray.append({ itemDescription: '', quantity: 1 })}
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
                <div className="sm:col-span-2">
                  <Input {...register(`items.${idx}.itemDescription` as const)} placeholder="รายละเอียดสินค้า" />
                  {errors.items?.[idx]?.itemDescription && (
                    <p className="mt-1 text-xs text-red-600">{errors.items[idx]?.itemDescription?.message}</p>
                  )}
                </div>
                <div>
                  <Select {...register(`items.${idx}.categoryId` as const)}>
                    <option value="">หมวดหมู่ (ถ้ามี)</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Input type="number" min={1} {...register(`items.${idx}.quantity` as const)} placeholder="จำนวน" />
                  {errors.items?.[idx]?.quantity && (
                    <p className="mt-1 text-xs text-red-600">{errors.items[idx]?.quantity?.message}</p>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register(`items.${idx}.unitPrice` as const)}
                  placeholder="ราคาต่อหน่วย (บาท)"
                />
              </div>
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
