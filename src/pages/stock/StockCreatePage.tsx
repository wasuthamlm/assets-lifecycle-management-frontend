import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateStockItemMutation } from '@/hooks/useStock'
import { useAssetCategoriesQuery } from '@/hooks/useMasterData'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { getErrorMessage } from '@/lib/errorMessage'

const formSchema = z.object({
  categoryId: z.coerce.number().int().positive('กรุณาเลือกหมวดหมู่'),
  itemName: z.string().min(1, 'กรุณากรอกชื่อรายการ'),
  unit: z.string().optional(),
  description: z.string().optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export function StockCreatePage() {
  usePageTitle('เพิ่มรายการพัสดุ')
  const navigate = useNavigate()
  const create = useCreateStockItemMutation()
  const { data: categories = [] } = useAssetCategoriesQuery()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(formSchema) })

  function onSubmit(values: FormValues) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('เพิ่มรายการพัสดุเรียบร้อยแล้ว')
        navigate('/stock')
      },
      onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
    })
  }

  return (
    <div>
      <BackLink />
      <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อรายการ</label>
            <Input {...register('itemName')} placeholder="กระดาษ A4" />
            {errors.itemName && <p className="mt-1 text-xs text-red-600">{errors.itemName.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมวดหมู่</label>
            <Select {...register('categoryId')}>
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </Select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หน่วยนับ</label>
            <Input {...register('unit')} placeholder="ชิ้น / กล่อง / เส้น" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รายละเอียด</label>
          <Textarea rows={3} {...register('description')} />
        </div>

        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </form>
      </Card>
    </div>
  )
}
