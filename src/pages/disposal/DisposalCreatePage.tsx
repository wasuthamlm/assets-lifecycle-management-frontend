import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateDisposalMutation } from '@/hooks/useDisposal'
import { useAssetQuery } from '@/hooks/useAssets'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AssetCombobox } from '@/components/assets/AssetCombobox'
import { DisposalMethod } from '@/api/types/common.types'
import { DISPOSAL_METHOD_LABEL } from '@/lib/constants'
import { optionalNonNegativeNumber } from '@/lib/zodHelpers'
import { getErrorMessage } from '@/lib/errorMessage'

const formSchema = z.object({
  assetId: z.coerce.number().int().positive('กรุณาเลือกทรัพย์สิน'),
  disposalMethod: z.nativeEnum(DisposalMethod),
  disposalDate: z.string().min(1, 'กรุณาเลือกวันที่จำหน่าย'),
  saleAmount: optionalNonNegativeNumber(),
  reason: z.string().optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export function DisposalCreatePage() {
  usePageTitle('บันทึกการจำหน่ายทิ้ง')
  const navigate = useNavigate()
  const create = useCreateDisposalMutation()
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disposalMethod: DisposalMethod.SOLD,
    },
  })

  const { data: pendingAsset } = useAssetQuery(pendingValues?.assetId ?? 0)

  function onSubmit(values: FormValues) {
    setPendingValues(values)
  }

  function confirmSubmit() {
    if (!pendingValues) return
    create.mutate(pendingValues, {
      onSuccess: (disposal) => {
        toast.success('บันทึกการจำหน่ายทิ้งเรียบร้อยแล้ว')
        setPendingValues(null)
        navigate(`/disposal/${disposal.disposalId}`)
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ'))
        setPendingValues(null)
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
            <Controller
              name="assetId"
              control={control}
              render={({ field }) => (
                <AssetCombobox value={(field.value as number) || undefined} onChange={(assetId) => field.onChange(assetId ?? '')} />
              )}
            />
            {errors.assetId && <p className="mt-1 text-xs text-red-600">{errors.assetId.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วิธีจำหน่าย</label>
            <Select {...register('disposalMethod')}>
              {Object.values(DisposalMethod).map((m) => (
                <option key={m} value={m}>
                  {DISPOSAL_METHOD_LABEL[m]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่จำหน่าย</label>
            <Input type="date" {...register('disposalDate')} />
            {errors.disposalDate && <p className="mt-1 text-xs text-red-600">{errors.disposalDate.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">มูลค่าที่ขายได้ (บาท)</label>
            <Input type="number" step="0.01" {...register('saleAmount')} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เหตุผล</label>
          <Textarea rows={3} {...register('reason')} />
        </div>

        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </form>
      </Card>

      <ConfirmDialog
        open={!!pendingValues}
        title="บันทึกการจำหน่ายทิ้ง"
        description={`บันทึกการจำหน่ายทิ้งทรัพย์สิน "${pendingAsset?.assetName ?? ''}" ด้วยวิธี "${pendingValues ? DISPOSAL_METHOD_LABEL[pendingValues.disposalMethod] : ''}" ใช่หรือไม่? การบันทึกนี้ไม่สามารถย้อนกลับได้`}
        confirmLabel="บันทึกการจำหน่ายทิ้ง"
        isLoading={create.isPending}
        onConfirm={confirmSubmit}
        onCancel={() => setPendingValues(null)}
      />
    </div>
  )
}
