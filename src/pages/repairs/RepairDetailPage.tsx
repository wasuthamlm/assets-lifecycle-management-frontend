import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useRepairQuery, useUpdateRepairStatusMutation } from '@/hooks/useRepairs'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { DetailSheet, Section } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { RepairStatusPill } from '@/components/ui/StatusPill'
import { Timeline, type TimelineStep } from '@/components/ui/Timeline'
import { RepairResult, RepairStatus } from '@/api/types/common.types'
import { REPAIR_RESULT_LABEL, REPAIR_STATUS_LABEL } from '@/lib/constants'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'

export function RepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const repairId = Number(id)
  usePageTitle(`งานซ่อม #${id}`)
  const { data: repair, isLoading, isError, error, refetch } = useRepairQuery(repairId)
  const updateStatus = useUpdateRepairStatusMutation(repairId)
  const { hasPermission } = usePermission()

  const [status, setStatus] = useState<RepairStatus | ''>('')
  const [result, setResult] = useState<RepairResult | ''>('')
  const [repairCost, setRepairCost] = useState('')
  const [notes, setNotes] = useState('')

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !repair) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบงานซ่อมนี้" />
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
        onError: (error) => toast.error(getErrorMessage(error, 'อัปเดตไม่สำเร็จ')),
      },
    )
  }

  const rank: Record<RepairStatus, number> = {
    [RepairStatus.REPORTED]: 0,
    [RepairStatus.REPAIRING]: 1,
    [RepairStatus.SENT_TO_VENDOR]: 1,
    [RepairStatus.REPAIRED]: 2,
    [RepairStatus.CLOSED]: 3,
  }
  const currentRank = rank[repair.status]
  const steps: TimelineStep[] = [
    { label: 'แจ้งซ่อม', timestamp: formatThaiDate(repair.createdAt), status: 'done' },
    {
      label: 'ดำเนินการซ่อม',
      timestamp: repair.sentToVendorDate ? formatThaiDate(repair.sentToVendorDate) : undefined,
      description: repair.vendor ? `ส่งซ่อม: ${repair.vendor.vendorName}` : 'ซ่อมภายใน',
      status: currentRank > 1 ? 'done' : currentRank === 1 ? 'current' : 'pending',
    },
    {
      label: 'ซ่อมเสร็จ',
      timestamp: repair.repairedDate ? formatThaiDate(repair.repairedDate) : undefined,
      description: repair.result ? REPAIR_RESULT_LABEL[repair.result] : undefined,
      status: currentRank > 2 ? 'done' : currentRank === 2 ? 'current' : 'pending',
    },
    {
      label: 'ปิดงาน',
      status: currentRank === 3 ? 'done' : 'pending',
    },
  ]

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <Section>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {repair.asset ? `${repair.asset.assetNo} — ${repair.asset.assetName}` : `ทรัพย์สิน #${repair.assetId}`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">ผู้รับซ่อม: {repair.vendor?.vendorName ?? 'ซ่อมภายใน'}</p>
            </div>
            <RepairStatusPill status={repair.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
        </Section>

        <Section title="ความคืบหน้า">
          <Timeline steps={steps} />
        </Section>

        {hasPermission('repair.update') && repair.status !== RepairStatus.CLOSED && (
        <Section title="อัปเดตสถานะงานซ่อม" className="space-y-3">
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
        </Section>
        )}
      </DetailSheet>
    </div>
  )
}
