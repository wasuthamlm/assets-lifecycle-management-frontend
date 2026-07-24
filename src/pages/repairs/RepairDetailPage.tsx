import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { useRepairQuery, useUpdateRepairStatusMutation } from '@/hooks/useRepairs'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { RepairStatusPill } from '@/components/ui/StatusPill'
import { RepairResult, RepairStatus } from '@/api/types/common.types'
import type { ApiErrorShape } from '@/api/types/common.types'
import { REPAIR_RESULT_LABEL, REPAIR_STATUS_LABEL } from '@/lib/constants'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'

export function RepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const repairId = Number(id)
  usePageTitle(`งานซ่อม #${id}`)
  const { data: repair, isLoading } = useRepairQuery(repairId)
  const updateStatus = useUpdateRepairStatusMutation(repairId)
  const { hasPermission } = usePermission()

  const [status, setStatus] = useState<RepairStatus | ''>('')
  const [result, setResult] = useState<RepairResult | ''>('')
  const [repairCost, setRepairCost] = useState('')
  const [notes, setNotes] = useState('')

  if (isLoading || !repair) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  function handleUpdate() {
    if (!status) return
    updateStatus.mutate(
      {
        status,
        result: result || undefined,
        repairCost: repairCost ? Number(repairCost) : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success('อัปเดตสถานะเรียบร้อยแล้ว')
          setStatus('')
          setResult('')
          setRepairCost('')
          setNotes('')
        },
        onError: (error) => {
          const message =
            error instanceof AxiosError
              ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'อัปเดตไม่สำเร็จ')
              : 'อัปเดตไม่สำเร็จ'
          toast.error(Array.isArray(message) ? message.join(', ') : message)
        },
      },
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {repair.asset ? `${repair.asset.assetNo} — ${repair.asset.assetName}` : `ทรัพย์สิน #${repair.assetId}`}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">ผู้รับซ่อม: {repair.vendor?.vendorName ?? 'ซ่อมภายใน'}</p>
          </div>
          <RepairStatusPill status={repair.status} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">วันที่แจ้งซ่อม</dt>
            <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(repair.createdAt)}</dd>
          </div>
          {repair.sentToVendorDate && (
            <div>
              <dt className="text-slate-400">วันที่ส่งซ่อม</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(repair.sentToVendorDate)}</dd>
            </div>
          )}
          {repair.repairedDate && (
            <div>
              <dt className="text-slate-400">วันที่ซ่อมเสร็จ</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatThaiDate(repair.repairedDate)}</dd>
            </div>
          )}
          {repair.result && (
            <div>
              <dt className="text-slate-400">ผลการซ่อม</dt>
              <dd className="text-slate-700 dark:text-slate-200">{REPAIR_RESULT_LABEL[repair.result]}</dd>
            </div>
          )}
          {repair.repairCost != null && (
            <div>
              <dt className="text-slate-400">ค่าใช้จ่าย</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatCurrency(repair.repairCost)} บาท</dd>
            </div>
          )}
          {repair.problemDescription && (
            <div className="col-span-2">
              <dt className="text-slate-400">รายละเอียดปัญหา</dt>
              <dd className="text-slate-700 dark:text-slate-200">{repair.problemDescription}</dd>
            </div>
          )}
          {repair.notes && (
            <div className="col-span-2">
              <dt className="text-slate-400">หมายเหตุ</dt>
              <dd className="text-slate-700 dark:text-slate-200">{repair.notes}</dd>
            </div>
          )}
        </dl>
      </Card>

      {hasPermission('repair.update') && repair.status !== RepairStatus.CLOSED && (
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">อัปเดตสถานะงานซ่อม</h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">สถานะใหม่</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as RepairStatus)} className="max-w-xs">
              <option value="">เลือกสถานะ</option>
              {Object.values(RepairStatus).map((s) => (
                <option key={s} value={s}>
                  {REPAIR_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>

          {status === RepairStatus.CLOSED && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ผลการซ่อม</label>
              <Select value={result} onChange={(e) => setResult(e.target.value as RepairResult)} className="max-w-xs">
                <option value="">เลือกผลการซ่อม</option>
                {Object.values(RepairResult).map((r) => (
                  <option key={r} value={r}>
                    {REPAIR_RESULT_LABEL[r]}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ค่าใช้จ่าย (บาท)</label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={repairCost}
              onChange={(e) => setRepairCost(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมายเหตุ</label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button onClick={handleUpdate} disabled={!status || updateStatus.isPending}>
            {updateStatus.isPending ? 'กำลังบันทึก...' : 'บันทึกสถานะ'}
          </Button>
        </Card>
      )}
    </div>
  )
}
