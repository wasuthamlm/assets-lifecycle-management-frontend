import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { useAssetsQuery, useDeleteAssetMutation } from '@/hooks/useAssets'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AssetStatusPill } from '@/components/ui/StatusPill'
import { getErrorMessage } from '@/lib/errorMessage'
import { AssetStatus } from '@/api/types/common.types'
import type { Asset } from '@/api/types/asset.types'

const PAGE_SIZE = 20

// asset.category คือหมวดหมู่ "ปลายทาง" ที่เลือกไว้จริง (เลือกได้ทั้งหมวดหมู่หลักตรงๆ หรือหมวดหมู่ย่อย —
// ดู AssetCreatePage: หมวดหมู่ย่อยไม่บังคับ) ต้องแยกตรงนี้ว่าจะโชว์คอลัมน์ไหน ไม่ใช่ผูก parent เข้ากับ
// "หมวดหมู่หลัก" กับ category เข้ากับ "หมวดหมู่ย่อย" ตรงๆ เพราะถ้า category ไม่มี parent แปลว่ามันคือ
// หมวดหมู่หลักเอง (ไม่ใช่หมวดหมู่ย่อยที่หายไป) ต้องโชว์ที่คอลัมน์ "หมวดหมู่หลัก" ไม่ใช่ "หมวดหมู่ย่อย"
function mainCategoryName(asset: Asset): string {
  return asset.category?.parent?.categoryName ?? asset.category?.categoryName ?? '-'
}
function subCategoryName(asset: Asset): string {
  return asset.category?.parent ? asset.category.categoryName : '-'
}

export function AssetsListPage() {
  usePageTitle('ทรัพย์สิน')
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const canUpdate = hasPermission('asset.update')
  const canDelete = hasPermission('asset.delete')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const { data, isLoading, isError, refetch } = useAssetsQuery({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE })
  const deleteMutation = useDeleteAssetMutation()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  function confirmDelete() {
    if (!deletingAsset) return
    deleteMutation.mutate(deletingAsset.assetId, {
      onSuccess: () => {
        toast.success(`ลบทรัพย์สิน "${deletingAsset.assetName}" เรียบร้อยแล้ว`)
        setDeletingAsset(null)
      },
      onError: (e) => toast.error(getErrorMessage(e, 'ลบทรัพย์สินไม่สำเร็จ')),
    })
  }

  const columns: DataTableColumn<Asset>[] = [
    { key: 'name', header: 'ชื่อทรัพย์สิน', render: (a) => <span className="font-medium">{a.assetName}</span> },
    { key: 'brand', header: 'ยี่ห้อ', render: (a) => a.brand ?? '-' },
    { key: 'model', header: 'รุ่น', render: (a) => a.model ?? '-' },
    { key: 'categoryParent', header: 'หมวดหมู่หลัก', render: (a) => mainCategoryName(a) },
    { key: 'categorySub', header: 'หมวดหมู่ย่อย', render: (a) => subCategoryName(a) },
    { key: 'status', header: 'สถานะ', render: (a) => (a.currentStatus ? <AssetStatusPill status={a.currentStatus} /> : '-') },
    {
      key: 'action',
      header: '',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            disabled={a.currentStatus !== AssetStatus.IN_STOCK}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/requisitions/new?assetId=${a.assetId}`)
            }}
          >
            <ClipboardList size={14} /> ทำรายการ เบิก/ยืม
          </Button>
          {canUpdate && (
            <button
              type="button"
              title="แก้ไข"
              aria-label="แก้ไขทรัพย์สิน"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/assets/${a.assetId}/edit`)
              }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
            >
              <Pencil size={16} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              title="ลบ"
              aria-label="ลบทรัพย์สิน"
              onClick={(e) => {
                e.stopPropagation()
                setDeletingAsset(a)
              }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อทรัพย์สิน, S/N..."
          className="max-w-xs"
        />
        {hasPermission('asset.create') && (
          <Button onClick={() => navigate('/assets/new')}>
            <Plus size={16} /> เพิ่มทรัพย์สินใหม่
          </Button>
        )}
      </div>

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(a) => a.assetId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyMessage={search ? 'ไม่พบทรัพย์สินที่ค้นหา' : 'ยังไม่มีทรัพย์สินในระบบ'}
            emptyAction={
              !search && hasPermission('asset.create') ? (
                <Button size="sm" onClick={() => navigate('/assets/new')}>
                  <Plus size={16} /> เพิ่มทรัพย์สินใหม่
                </Button>
              ) : undefined
            }
          />
        </div>
        {data && <Pagination page={page} totalItems={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
      </Card>

      <ConfirmDialog
        open={!!deletingAsset}
        title="ลบทรัพย์สิน"
        description={`ลบทรัพย์สิน "${deletingAsset?.assetName}" ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบทรัพย์สิน"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingAsset(null)}
      />
    </div>
  )
}
