import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { Plus } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useWarrantiesByAssetQuery, useCreateWarrantyMutation } from '@/hooks/useWarranty'
import { useAssetsQuery } from '@/hooks/useAssets'
import { useVendorsQuery } from '@/hooks/useMasterData'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { WarrantyStatusPill } from '@/components/ui/StatusPill'
import { formatThaiDate } from '@/lib/formatters'
import type { ApiErrorShape } from '@/api/types/common.types'
import type { Warranty } from '@/api/types/warranty.types'

const formSchema = z.object({
  vendorId: z.coerce.number().int().positive().optional(),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มคุ้มครอง'),
  endDate: z.string().min(1, 'กรุณาเลือกวันที่สิ้นสุด'),
  coverageDetail: z.string().optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export function WarrantySearchPage() {
  usePageTitle('ประกัน')
  const navigate = useNavigate()
  const [assetId, setAssetId] = useState<number | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const { data: assetsPage } = useAssetsQuery({ limit: 100 })
  const assets = assetsPage?.data ?? []
  const { data: vendors = [] } = useVendorsQuery()
  const { data: warranties = [], isLoading } = useWarrantiesByAssetQuery(assetId ?? 0)
  const create = useCreateWarrantyMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(formSchema) })

  function onSubmit(values: FormValues) {
    if (!assetId) return
    create.mutate(
      { ...values, assetId },
      {
        onSuccess: () => {
          toast.success('เพิ่มข้อมูลประกันเรียบร้อยแล้ว')
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

  const columns: DataTableColumn<Warranty>[] = [
    { key: 'vendor', header: 'ผู้รับประกัน', render: (w) => w.vendor?.vendorName ?? '-' },
    { key: 'start', header: 'เริ่มคุ้มครอง', render: (w) => formatThaiDate(w.startDate) },
    { key: 'end', header: 'สิ้นสุด', render: (w) => formatThaiDate(w.endDate) },
    { key: 'status', header: 'สถานะ', render: (w) => <WarrantyStatusPill status={w.status} /> },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-sm flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">เลือกทรัพย์สินเพื่อดูประวัติประกัน</label>
            <Select value={assetId ?? ''} onChange={(e) => setAssetId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">เลือกทรัพย์สิน</option>
              {assets.map((a) => (
                <option key={a.assetId} value={a.assetId}>
                  {a.assetNo} — {a.assetName}
                </option>
              ))}
            </Select>
          </div>
          <Button disabled={!assetId} onClick={() => setModalOpen(true)}>
            <Plus size={16} /> เพิ่มข้อมูลประกัน
          </Button>
        </div>
      </Card>

      {assetId ? (
        <Card className="p-0">
          <div className="p-4">
            <DataTable
              columns={columns}
              rows={warranties}
              rowKey={(w) => w.warrantyId}
              isLoading={isLoading}
              emptyMessage="ทรัพย์สินนี้ยังไม่มีประวัติประกัน"
              onRowClick={(w) => navigate(`/warranty/${w.warrantyId}`)}
            />
          </div>
        </Card>
      ) : (
        <p className="text-sm text-slate-400">กรุณาเลือกทรัพย์สินเพื่อดูประวัติการรับประกัน</p>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="เพิ่มข้อมูลประกัน">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผู้รับประกัน</label>
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
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่เริ่มคุ้มครอง</label>
            <Input type="date" {...register('startDate')} />
            {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">วันที่สิ้นสุด</label>
            <Input type="date" {...register('endDate')} />
            {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รายละเอียดความคุ้มครอง</label>
            <Textarea rows={2} {...register('coverageDetail')} />
          </div>
          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
