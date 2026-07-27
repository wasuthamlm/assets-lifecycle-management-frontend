import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useWarrantyQuery, useRenewWarrantyMutation } from '@/hooks/useWarranty'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DetailSheet } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { WarrantyStatusPill } from '@/components/ui/StatusPill'
import { WarrantyStatus, type ApiErrorShape } from '@/api/types/common.types'
import { formatThaiDate } from '@/lib/formatters'

const formSchema = z.object({
  newEndDate: z.string().min(1, 'กรุณาเลือกวันที่สิ้นสุดใหม่'),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export function WarrantyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const warrantyId = Number(id)
  usePageTitle(`ข้อมูลประกัน #${id}`)
  const { data: warranty, isLoading } = useWarrantyQuery(warrantyId)
  const renew = useRenewWarrantyMutation(warrantyId)
  const [modalOpen, setModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(formSchema) })

  function onSubmit(values: FormValues) {
    renew.mutate(
      { newEndDate: values.newEndDate },
      {
        onSuccess: () => {
          toast.success('ต่ออายุประกันเรียบร้อยแล้ว')
          setModalOpen(false)
          reset()
        },
        onError: (error) => {
          const message =
            error instanceof AxiosError
              ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'บันทึกไม่สำเร็จ')
              : 'บันทึกไม่สำเร็จ'
          toast.error(Array.isArray(message) ? message.join(', ') : message)
        },
      },
    )
  }

  if (isLoading || !warranty) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {warranty.asset ? `${warranty.asset.assetNo} — ${warranty.asset.assetName}` : `ทรัพย์สิน #${warranty.assetId}`}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{warranty.vendor?.vendorName ?? 'ไม่ระบุผู้รับประกัน'}</p>
          </div>
          <WarrantyStatusPill status={warranty.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">วันที่เริ่มคุ้มครอง</dt>
            <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(warranty.startDate)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">วันที่สิ้นสุด</dt>
            <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(warranty.endDate)}</dd>
          </div>
          {warranty.coverageDetail && (
            <div className="col-span-2">
              <dt className="text-slate-400">รายละเอียดความคุ้มครอง</dt>
              <dd className="text-slate-700 dark:text-slate-200">{warranty.coverageDetail}</dd>
            </div>
          )}
        </dl>

        {warranty.status !== WarrantyStatus.RENEWED && (
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              ต่ออายุประกัน
            </Button>
          </div>
        )}
      </DetailSheet>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="ต่ออายุประกัน">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่สิ้นสุดใหม่</label>
            <Input type="date" {...register('newEndDate')} />
            {errors.newEndDate && <p className="mt-1 text-xs text-red-600">{errors.newEndDate.message}</p>}
          </div>
          <Button type="submit" disabled={renew.isPending} className="w-full">
            {renew.isPending ? 'กำลังบันทึก...' : 'ยืนยันการต่ออายุ'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
