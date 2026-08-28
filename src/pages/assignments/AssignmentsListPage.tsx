import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeftRight, RotateCcw } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAssetsQuery } from '@/hooks/useAssets'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
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
import { EmptyState } from '@/components/ui/EmptyState'
import { IssueAssetForm } from '@/components/assignments/IssueAssetForm'
import { ReturnAssetForm } from '@/components/assignments/ReturnAssetForm'
import { ASSIGNMENT_TYPE_LABEL, HOLDER_TYPE_LABEL, RETURN_CONDITION_LABEL } from '@/lib/constants'
import { formatThaiDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'
import type { Assignment, IssueAssetDto, ReturnAssetDto } from '@/api/types/assignment.types'

export function AssignmentsListPage() {
  usePageTitle('การเบิก-จ่าย/รับคืน')
  const navigate = useNavigate()
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
  } = usePendingReturnsQuery()
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

  const isOverdue = (a: Assignment) => !!a.dueDate && new Date(a.dueDate) < new Date()

  const pendingColumns: DataTableColumn<Assignment>[] = [
    {
      key: 'asset',
      header: 'ทรัพย์สิน',
      render: (a) => (a.asset ? a.asset.assetName : `#${a.assetId}`),
    },
    { key: 'holder', header: 'ผู้ถือครอง', render: (a) => `${HOLDER_TYPE_LABEL[a.holderType]} #${a.holderId}` },
    { key: 'issued', header: 'วันที่เบิก-จ่าย', render: (a) => formatThaiDate(a.issuedDate) },
    {
      key: 'due',
      header: 'กำหนดคืน',
      render: (a) =>
        a.dueDate ? (
          <span className={cn(isOverdue(a) && 'font-medium text-red-600 dark:text-red-400')}>
            {formatThaiDate(a.dueDate)}
            {isOverdue(a) && ' (เกินกำหนด)'}
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

  const columns: DataTableColumn<Assignment>[] = [
    { key: 'type', header: 'ประเภท', render: (a) => ASSIGNMENT_TYPE_LABEL[a.assignmentType] },
    { key: 'holder', header: 'ผู้ถือครอง', render: (a) => `${HOLDER_TYPE_LABEL[a.holderType]} #${a.holderId}` },
    { key: 'issued', header: 'วันที่เบิก-จ่าย', render: (a) => formatThaiDate(a.issuedDate) },
    { key: 'due', header: 'กำหนดคืน', render: (a) => (a.dueDate ? formatThaiDate(a.dueDate) : '-') },
    {
      key: 'returned',
      header: 'สถานะ',
      render: (a) =>
        a.returnedDate
          ? `คืนแล้ว (${a.returnCondition ? RETURN_CONDITION_LABEL[a.returnCondition] : '-'}) — ${formatThaiDate(a.returnedDate)}`
          : 'ยังไม่คืน',
    },
    {
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
    },
  ]

  return (
    <div className="space-y-4">
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

      <Card>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ค้นหาทรัพย์สิน</label>
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
              <Button size="sm" onClick={() => setIssueOpen(true)}>
                <ArrowLeftRight size={14} /> เบิก-จ่าย
              </Button>
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

      {!selectedAsset && (
        <Card>
          <EmptyState message="ค้นหาและเลือกทรัพย์สินเพื่อดูประวัติการเบิก-จ่าย/รับคืน" />
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
