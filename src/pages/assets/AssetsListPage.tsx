import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList } from 'lucide-react'
import { useAssetsQuery } from '@/hooks/useAssets'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { AvailabilityPill } from '@/components/ui/StatusPill'
import type { Asset } from '@/api/types/asset.types'

const PAGE_SIZE = 20

export function AssetsListPage() {
  usePageTitle('ทรัพย์สิน')
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAssetsQuery({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const columns: DataTableColumn<Asset>[] = [
    { key: 'no', header: 'เลขทรัพย์สิน', render: (a) => <span className="font-medium">{a.assetNo}</span> },
    { key: 'name', header: 'ชื่อทรัพย์สิน', render: (a) => a.assetName },
    { key: 'category', header: 'หมวดหมู่', render: (a) => a.category?.categoryName ?? '-' },
    { key: 'status', header: 'สถานะ', render: (a) => <AvailabilityPill available={(a.availableCount ?? 0) > 0} /> },
    { key: 'available', header: 'จำนวนชิ้นที่เหลืออยู่', render: (a) => a.availableCount ?? 0 },
    {
      key: 'action',
      header: '',
      render: (a) => (
        <Button
          size="sm"
          variant="secondary"
          disabled={(a.availableCount ?? 0) === 0}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/requisitions/new?assetId=${a.assetId}`)
          }}
        >
          <ClipboardList size={14} /> ทำรายการ เบิก/ยืม
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขทรัพย์สิน, ชื่อ, S/N..."
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
    </div>
  )
}
