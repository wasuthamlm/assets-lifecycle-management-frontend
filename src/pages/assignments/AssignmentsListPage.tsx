import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeftRight, RotateCcw } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { useAssetsQuery } from '@/hooks/useAssets'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useAssignmentHistoryQuery,
  useAssignmentsByAssetQuery,
  useIssueAssetMutation,
  usePendingReturnsQuery,
  useReturnAssetMutation,
} from '@/hooks/useAssignments'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { AssetStatusPill } from '@/components/ui/StatusPill'
import { Pagination } from '@/components/ui/Pagination'
import { IssueAssetForm } from '@/components/assignments/IssueAssetForm'
import { ReturnAssetForm } from '@/components/assignments/ReturnAssetForm'
import { ASSIGNMENT_TYPE_LABEL, RETURN_CONDITION_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'
import { isAssignmentOverdue } from '@/lib/assignment'
import { resolveHolderName, resolveHolderDepartment, resolveHolderPhone } from '@/lib/holder'
import type { Assignment, IssueAssetDto, ReturnAssetDto } from '@/api/types/assignment.types'

const HISTORY_PAGE_SIZE = 20

export function AssignmentsListPage() {
  usePageTitle('การเบิก-จ่าย/รับคืน')
  const navigate = useNavigate()
  // route นี้เข้าได้ด้วย assignment.view_all (hr / it_admin) — ดูประวัติได้อย่างเดียว ส่วนคิว "รอรับคืน" + ปุ่มรับคืน
  // ต้องมี assignment.return และปุ่ม "เบิก-จ่าย" ต้องมี assignment.issue แยกต่างหาก (HR ไม่มีทั้งคู่ จึงไม่เห็น)
  const { hasPermission } = usePermission()
  const canIssue = hasPermission('assignment.issue')
  const canReturn = hasPermission('assignment.return')
  const [historyPage, setHistoryPage] = useState(1)
  const [assetSearch, setAssetSearch] = useState('')
  const debouncedAssetSearch = useDebouncedValue(assetSearch, 300)
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
  const [issueOpen, setIssueOpen] = useState(false)
  const [returningId, setReturningId] = useState<number | null>(null)

  const { data: assetsPage } = useAssetsQuery({ search: debouncedAssetSearch || undefined, limit: 10 })
  const assets = assetsPage?.data ?? []
  const selectedAsset = assets.find((a) => a.assetId === selectedAssetId)

  const {
    data: assignments = [],
    isLoading,
    isError,
    refetch,
  } = useAssignmentsByAssetQuery(selectedAssetId ?? undefined)
  const {
    data: pendingReturns = [],
    isLoading: pendingLoading,
    isError: pendingError,
    refetch: refetchPending,
  } = usePendingReturnsQuery({ enabled: canReturn })
  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useAssignmentHistoryQuery(historyPage, HISTORY_PAGE_SIZE)
  const issueMutation = useIssueAssetMutation()
  const returnMutation = useReturnAssetMutation(returningId ?? 0)

  function handleIssue(dto: IssueAssetDto) {
    issueMutation.mutate(dto, {
      onSuccess: () => {
        toast.success('บันทึกการเบิก-จ่ายเรียบร้อยแล้ว')
        setIssueOpen(false)
      },
      onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
    })
  }

  function handleReturn(dto: ReturnAssetDto) {
    returnMutation.mutate(dto, {
      onSuccess: () => {
        toast.success('บันทึกการรับคืนเรียบร้อยแล้ว')
        setReturningId(null)
      },
      onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
    })
  }

  const pendingColumns: DataTableColumn<Assignment>[] = [
    {
      key: 'asset',
      header: 'ทรัพย์สิน',
      render: (a) => (a.asset ? a.asset.assetName : `#${a.assetId}`),
    },
    { key: 'holderName', header: 'ชื่อผู้ถือครอง', render: (a) => resolveHolderName(a) },
    { key: 'holderDepartment', header: 'แผนก', render: (a) => resolveHolderDepartment(a) },
    { key: 'holderPhone', header: 'เบอร์โทร', render: (a) => resolveHolderPhone(a) },
    { key: 'issued', header: 'วันที่เบิก-จ่าย', render: (a) => formatThaiDate(a.issuedDate) },
    {
      key: 'due',
      header: 'กำหนดคืน',
      render: (a) =>
        a.dueDate ? (
          <span className={cn(isAssignmentOverdue(a) && 'font-medium text-red-600 dark:text-red-400')}>
            {formatThaiDate(a.dueDate)}
            {isAssignmentOverdue(a) && ' (เกินกำหนด)'}
          </span>
        ) : (
          '-'
        ),
    },
    { key: 'issuedBy', header: 'ผู้เบิกจ่าย', render: (a) => a.issuedByEmployee?.fullName ?? '-' },
    {
      key: 'action',
      header: '',
      render: (a) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setReturningId(a.assignmentId)
          }}
        >
          <RotateCcw size={14} /> รับคืน
        </Button>
      ),
    },
  ]

  const returnColumn: DataTableColumn<Assignment> = {
    key: 'action',
    header: '',
    render: (a) =>
      !a.returnedDate ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setReturningId(a.assignmentId)
          }}
        >
          <RotateCcw size={14} /> รับคืน
        </Button>
      ) : null,
  }

  const historyColumns: DataTableColumn<Assignment>[] = [
    {
      key: 'asset',
      header: 'ทรัพย์สิน',
      render: (a) => (a.asset ? a.asset.assetName : `#${a.assetId}`),
    },
    { key: 'serial', header: 'S/N', render: (a) => a.asset?.serialNumber ?? '-' },
    { key: 'type', header: 'ประเภท', render: (a) => ASSIGNMENT_TYPE_LABEL[a.assignmentType] },
    { key: 'holderName', header: 'ชื่อผู้ถือครอง', render: (a) => resolveHolderName(a) },
    { key: 'holderDepartment', header: 'แผนก', render: (a) => resolveHolderDepartment(a) },
    { key: 'issued', header: 'วันที่เบิก-จ่าย', render: (a) => formatThaiDate(a.issuedDate) },
    { key: 'due', header: 'กำหนดคืน', render: (a) => (a.dueDate ? formatThaiDate(a.dueDate) : '-') },
    {
      key: 'returned',
      header: 'สถานะ',
      render: (a) =>
        a.returnedDate ? (
          <span className={cn(a.isLateReturn && 'font-medium text-red-600 dark:text-red-400')}>
            {`คืนแล้ว — ${formatThaiDate(a.returnedDate)}`}
            {a.isLateReturn && ' (คืนล่าช้า)'}
          </span>
        ) : (
          <span className={cn(isAssignmentOverdue(a) && 'font-medium text-red-600 dark:text-red-400')}>
            {isAssignmentOverdue(a) ? 'ยังไม่คืน (เกินกำหนด)' : 'ยังไม่คืน'}
          </span>
        ),
    },
    { key: 'issuedBy', header: 'ผู้เบิกจ่าย', render: (a) => a.issuedByEmployee?.fullName ?? '-' },
    ...(canReturn ? [returnColumn] : []),
  ]

  const columns: DataTableColumn<Assignment>[] = [
    { key: 'type', header: 'ประเภท', render: (a) => ASSIGNMENT_TYPE_LABEL[a.assignmentType] },
    { key: 'holderName', header: 'ชื่อผู้ถือครอง', render: (a) => resolveHolderName(a) },
    { key: 'holderDepartment', header: 'แผนก', render: (a) => resolveHolderDepartment(a) },
    { key: 'holderPhone', header: 'เบอร์โทร', render: (a) => resolveHolderPhone(a) },
    { key: 'issued', header: 'วันที่เบิก-จ่าย', render: (a) => formatThaiDate(a.issuedDate) },
    { key: 'due', header: 'กำหนดคืน', render: (a) => (a.dueDate ? formatThaiDate(a.dueDate) : '-') },
    {
      key: 'returned',
      header: 'สถานะ',
      render: (a) =>
        a.returnedDate ? (
          <span className={cn(a.isLateReturn && 'font-medium text-red-600 dark:text-red-400')}>
            {`คืนแล้ว (${a.returnCondition ? RETURN_CONDITION_LABEL[a.returnCondition] : '-'}) — ${formatThaiDate(a.returnedDate)}`}
            {a.isLateReturn && ' (คืนล่าช้า)'}
          </span>
        ) : (
          'ยังไม่คืน'
        ),
    },
    ...(canReturn ? [returnColumn] : []),
  ]

  return (
    <div className="space-y-4">
      {canReturn && (
        <Card className="p-0">
          <div className="flex items-center justify-between p-4 pb-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              รอรับคืน {pendingReturns.length > 0 && `(${pendingReturns.length})`}
            </p>
          </div>
          <div className="p-4">
            <DataTable
              columns={pendingColumns}
              rows={pendingReturns}
              rowKey={(a) => a.assignmentId}
              isLoading={pendingLoading}
              isError={pendingError}
              onRetry={refetchPending}
              onRowClick={(a) => navigate(`/assignments/${a.assignmentId}`)}
              emptyMessage="ไม่มีทรัพย์สินที่รอรับคืนตอนนี้"
            />
          </div>
        </Card>
      )}

      <Card>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          ค้นหาทรัพย์สิน (ดูประวัติรายเครื่อง{canIssue && ' / เบิก-จ่าย'})
        </label>
        <Input
          value={assetSearch}
          onChange={(e) => {
            setAssetSearch(e.target.value)
            setSelectedAssetId(null)
          }}
          placeholder="ค้นหาชื่อทรัพย์สิน, S/N..."
          className="max-w-sm"
        />
        {assetSearch && !selectedAssetId && (
          <div className="mt-2 max-w-sm divide-y divide-slate-50 rounded-lg border border-slate-100 dark:divide-slate-800/60 dark:border-slate-800">
            {assets.length === 0 && <p className="p-3 text-sm text-slate-400">ไม่พบทรัพย์สิน</p>}
            {assets.map((a) => (
              <button
                key={a.assetId}
                type="button"
                onClick={() => {
                  setSelectedAssetId(a.assetId)
                  setAssetSearch(a.assetName)
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                {a.assetName}
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedAsset && (
        <Card className="p-0">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedAsset.assetName}</p>
              <div className="mt-1">{selectedAsset.currentStatus && <AssetStatusPill status={selectedAsset.currentStatus} />}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate(`/assets/${selectedAsset.assetId}`)}>
                ดูรายละเอียดทรัพย์สิน
              </Button>
              {canIssue && (
                <Button size="sm" onClick={() => setIssueOpen(true)}>
                  <ArrowLeftRight size={14} /> เบิก-จ่าย
                </Button>
              )}
            </div>
          </div>
          <div className="p-4 pt-0">
            <DataTable
              columns={columns}
              rows={assignments}
              rowKey={(a) => a.assignmentId}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
              onRowClick={(a) => navigate(`/assignments/${a.assignmentId}`)}
              emptyMessage="ยังไม่มีประวัติการเบิก-จ่าย"
            />
          </div>
        </Card>
      )}

      {/* ยังไม่ได้เลือกทรัพย์สิน — แสดงประวัติทั้งหมดของทุกคนเลย ไม่ต้องค้นหาก่อน */}
      {!selectedAsset && (
        <Card className="p-0">
          <div className="flex items-center justify-between p-4 pb-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              ประวัติการเบิก-จ่าย/รับคืนทั้งหมด {history && history.total > 0 && `(${history.total})`}
            </p>
          </div>
          <div className="p-4">
            <DataTable
              columns={historyColumns}
              rows={history?.data ?? []}
              rowKey={(a) => a.assignmentId}
              isLoading={historyLoading}
              isError={historyError}
              onRetry={refetchHistory}
              onRowClick={(a) => navigate(`/assignments/${a.assignmentId}`)}
              emptyMessage="ยังไม่มีประวัติการเบิก-จ่าย"
            />
          </div>
          {history && (
            <Pagination page={historyPage} totalItems={history.total} pageSize={HISTORY_PAGE_SIZE} onPageChange={setHistoryPage} />
          )}
        </Card>
      )}

      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title="เบิก-จ่ายทรัพย์สิน">
        {selectedAssetId && (
          <IssueAssetForm assetId={selectedAssetId} onSubmit={handleIssue} isSubmitting={issueMutation.isPending} />
        )}
      </Modal>

      <Modal open={returningId != null} onClose={() => setReturningId(null)} title="รับคืนทรัพย์สิน">
        <ReturnAssetForm onSubmit={handleReturn} isSubmitting={returnMutation.isPending} />
      </Modal>
    </div>
  )
}
