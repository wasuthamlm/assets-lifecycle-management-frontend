import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateRepairMutation } from '@/hooks/useRepairs'
import { useAssetsQuery } from '@/hooks/useAssets'
import { useVendorsQuery } from '@/hooks/useMasterData'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { optionalPositiveInt } from '@/lib/zodHelpers'
import type { ApiErrorShape } from '@/api/types/common.types'

const formSchema = z.object({
  assetId: z.coerce.number().int().positive('กรุณาเลือกทรัพย์สิน'),
  problemDescription: z.string().optional(),
  vendorId: optionalPositiveInt(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export function RepairCreatePage() {
  usePageTitle('แจ้งซ่อม')
  const navigate = useNavigate()
  const create = useCreateRepairMutation()
  const { data: assetsPage } = useAssetsQuery({ limit: 100 })
  const assets = assetsPage?.data ?? []
  const { data: vendors = [] } = useVendorsQuery()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: FormValues) {
    create.mutate(values, {
      onSuccess: (repair) => {
        toast.success('แจ้งซ่อมเรียบร้อยแล้ว')
        navigate(`/repairs/${repair.repairId}`)
      },
      onError: (error) => {
        const message =
          error instanceof AxiosError
            ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'บันทึกไม่สำเร็จ')
            : 'บันทึกไม่สำเร็จ'
        toast.error(Array.isArray(message) ? message.join(', ') : message)
      },
    })
  }

  return (
    <div>
      <BackLink />
      <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ทรัพย์สิน</label>
            <Select {...register('assetId')}>
              <option value="">เลือกทรัพย์สิน</option>
              {assets.map((a) => (
                <option key={a.assetId} value={a.assetId}>
                  {a.assetNo} — {a.assetName}
                </option>
              ))}
            </Select>
            {errors.assetId && <p className="mt-1 text-xs text-red-600">{errors.assetId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้รับซ่อม (ถ้าส่งซ่อมภายนอก)</label>
            <Select {...register('vendorId')}>
              <option value="">ซ่อมภายใน</option>
              {vendors.map((v) => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.vendorName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รายละเอียดปัญหา</label>
          <Textarea rows={3} {...register('problemDescription')} placeholder="อธิบายอาการเสีย/ปัญหาที่พบ" />
        </div>

        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'กำลังบันทึก...' : 'แจ้งซ่อม'}
        </Button>
      </form>
      </Card>
    </div>
  )
}
