import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateAssetMutation } from '@/hooks/useAssets'
import { useAssetCategoriesQuery, useVendorsQuery, useLocationsQuery } from '@/hooks/useMasterData'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { optionalDateString, optionalNonNegativeNumber, optionalPositiveInt } from '@/lib/zodHelpers'
import { getErrorMessage } from '@/lib/errorMessage'

const formSchema = z.object({
  assetNo: z.string().min(1, 'กรุณากรอกเลขทรัพย์สิน'),
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

export function AssetCreatePage() {
  usePageTitle('เพิ่มทรัพย์สินใหม่')
  const navigate = useNavigate()
  const create = useCreateAssetMutation()
  const { data: categories = [] } = useAssetCategoriesQuery()
  const { data: vendors = [] } = useVendorsQuery()
  const { data: locations = [] } = useLocationsQuery()

  const [mainCategoryId, setMainCategoryId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')
  const [categoryError, setCategoryError] = useState('')

  const mainCategories = categories.filter((c) => !c.parentCategoryId)
  const subCategories = categories.filter((c) => c.parentCategoryId === Number(mainCategoryId))

  function handleMainCategoryChange(value: string) {
    setMainCategoryId(value)
    setSubCategoryId('')
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(formSchema) })

  function onSubmit(values: FormValues) {
    if (!mainCategoryId) {
      setCategoryError('กรุณาเลือกหมวดหมู่หลัก')
      return
    }
    if (subCategories.length > 0 && !subCategoryId) {
      setCategoryError('กรุณาเลือกหมวดหมู่ย่อย')
      return
    }
    const categoryId = subCategoryId || mainCategoryId
    setCategoryError('')
    create.mutate(
      { ...values, categoryId: Number(categoryId) },
      {
        onSuccess: (asset) => {
          toast.success('เพิ่มทรัพย์สินใหม่เรียบร้อยแล้ว')
          navigate(`/assets/${asset.assetId}`)
        },
        onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  return (
    <div>
      <BackLink />
      <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เลขทรัพย์สิน <span className="text-red-600">*</span></label>
            <Input {...register('assetNo')} placeholder="FA-2026-00123" />
            {errors.assetNo && <p className="mt-1 text-xs text-red-600">{errors.assetNo.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อทรัพย์สิน <span className="text-red-600">*</span></label>
            <Input {...register('assetName')} placeholder="Notebook Dell Latitude" />
            {errors.assetName && <p className="mt-1 text-xs text-red-600">{errors.assetName.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมวดหมู่หลัก <span className="text-red-600">*</span></label>
            <Select value={mainCategoryId} onChange={(e) => handleMainCategoryChange(e.target.value)}>
              <option value="">เลือกหมวดหมู่หลัก</option>
              {mainCategories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมวดหมู่ย่อย <span className="text-red-600">*</span></label>
            <Select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
              {mainCategoryId ? (
                subCategories.length > 0 ? (
                  <>
                    <option value="">เลือกหมวดหมู่ย่อย</option>
                    {subCategories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">ไม่มีหมวดหมู่ย่อย</option>
                )
              ) : (
                <option value="">เลือกหมวดหมู่หลักก่อน</option>
              )}
            </Select>
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

        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </form>
      </Card>
    </div>
  )
}
