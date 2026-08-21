import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useWarrantiesByAssetQuery, useCreateWarrantyMutation } from '@/hooks/useWarranty'
import { useVendorsQuery } from '@/hooks/useMasterData'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { AssetCombobox } from '@/components/assets/AssetCombobox'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { BackLink } from '@/components/ui/BackLink'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { WarrantyStatusPill } from '@/components/ui/StatusPill'
import { formatThaiDate } from '@/lib/formatters'
import { optionalPositiveInt } from '@/lib/zodHelpers'
import { getErrorMessage } from '@/lib/errorMessage'
import type { Warranty } from '@/api/types/warranty.types'

const formSchema = z.object({
  vendorId: optionalPositiveInt(),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มคุ้มครอง'),
  endDate: z.string().min(1, 'กรุณาเลือกวันที่สิ้นสุด'),
  coverageDetail: z.string().optional(),
})

type FormValues = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export function WarrantySearchPage() {
  usePageTitle('ประกัน')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const assetIdParam = searchParams.get('assetId')
  const [assetId, setAssetId] = useState<number | undefined>(assetIdParam ? Number(assetIdParam) : undefined)
  const [addFormOpen, setAddFormOpen] = useState(false)
  const { data: vendors = [] } = useVendorsQuery()
  const {
    data: warranties = [],
    isLoading,
    isError,
    refetch,
  } = useWarrantiesByAssetQuery(assetId ?? 0)
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
          setAddFormOpen(false)
          reset()
        },
        onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  const columns: DataTableColumn<Warranty>[] = [
    { key: 'vendor', header: 'ผู้รับประกัน', render: (w) => w.vendor?.vendorName ?? '-' },
    { key: 'start', header: 'เริ่มคุ้มครอง', render: (w) => formatThaiDate(w.startDate) },
    { key: 'end', header: 'สิ้นสุด', render: (w) => formatThaiDate(w.endDate) },
    { key: 'status', header: 'สถานะ', render: (w) => <WarrantyStatusPill status={w.status} /> },
  ]

  function toggleAddForm() {
    if (addFormOpen) reset()
    setAddFormOpen((prev) => !prev)
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-sm flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">เลือกทรัพย์สินเพื่อดูประวัติประกัน</label>
            <AssetCombobox value={assetId} onChange={setAssetId} />
          </div>
          <Button disabled={!assetId} onClick={toggleAddForm} variant={addFormOpen ? 'secondary' : 'primary'}>
            <Plus size={16} /> {addFormOpen ? 'ยกเลิกการเพิ่ม' : 'เพิ่มข้อมูลประกัน'}
          </Button>
        </div>
      </Card>

      {addFormOpen && assetId && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">เพิ่มข้อมูลประกันใหม่</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div />
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
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รายละเอียดความคุ้มครอง</label>
              <Textarea rows={2} {...register('coverageDetail')} />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={toggleAddForm}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {assetId ? (
        <Card className="p-0">
          <div className="p-4">
            <DataTable
              columns={columns}
              rows={warranties}
              rowKey={(w) => w.warrantyId}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
              emptyMessage="ทรัพย์สินนี้ยังไม่มีประวัติประกัน"
              onRowClick={(w) => navigate(`/warranty/${w.warrantyId}`)}
            />
          </div>
        </Card>
      ) : (
        <p className="text-sm text-slate-400">กรุณาเลือกทรัพย์สินเพื่อดูประวัติการรับประกัน</p>
      )}
    </div>
  )
}
