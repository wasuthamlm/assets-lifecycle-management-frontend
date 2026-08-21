import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStockItemsQuery, useStockLevelsByLocationQuery } from '@/hooks/useStock'
import { useLocationsQuery } from '@/hooks/useMasterData'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { cn } from '@/lib/utils'
import type { StockItem, StockLevel } from '@/api/types/stock.types'

type Tab = 'items' | 'levels'

export function StockListPage() {
  usePageTitle('คลังพัสดุสิ้นเปลือง')
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('items')
  const [search, setSearch] = useState('')
  const [locationId, setLocationId] = useState<number | undefined>(undefined)

  const { data: items = [], isLoading: itemsLoading, isError: itemsError, refetch: refetchItems } = useStockItemsQuery()
  const { data: locations = [] } = useLocationsQuery()
  const {
    data: levels = [],
    isLoading: levelsLoading,
    isError: levelsError,
    refetch: refetchLevels,
  } = useStockLevelsByLocationQuery(locationId ?? 0)

  const filteredItems = items.filter((i) => i.itemName.toLowerCase().includes(search.toLowerCase()))

  const itemColumns: DataTableColumn<StockItem>[] = [
    { key: 'name', header: 'ชื่อรายการ', render: (i) => <span className="font-medium">{i.itemName}</span> },
    { key: 'category', header: 'หมวดหมู่', render: (i) => i.category?.categoryName ?? '-' },
    { key: 'unit', header: 'หน่วยนับ', render: (i) => i.unit ?? '-' },
    { key: 'description', header: 'รายละเอียด', render: (i) => i.description ?? '-' },
  ]

  const levelColumns: DataTableColumn<StockLevel>[] = [
    { key: 'item', header: 'รายการ', render: (l) => l.stockItem?.itemName ?? `#${l.stockItemId}` },
    { key: 'qty', header: 'จำนวนคงเหลือ', render: (l) => `${l.quantityOnHand} ${l.stockItem?.unit ?? ''}` },
  ]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'items', label: 'รายการพัสดุ' },
    { key: 'levels', label: 'ยอดคงเหลือตามสถานที่' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200',
              tab === t.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อรายการ..."
              className="max-w-xs"
            />
            <Button onClick={() => navigate('/stock/new')}>
              <Plus size={16} /> เพิ่มรายการพัสดุ
            </Button>
          </div>
          <Card className="p-0">
            <div className="p-4">
              <DataTable
                columns={itemColumns}
                rows={filteredItems}
                rowKey={(i) => i.stockItemId}
                isLoading={itemsLoading}
                isError={itemsError}
                onRetry={refetchItems}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'levels' && (
        <>
          <Card>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">เลือกสถานที่</label>
            <Select
              className="max-w-xs"
              value={locationId ?? ''}
              onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">เลือกสถานที่</option>
              {locations.map((l) => (
                <option key={l.locationId} value={l.locationId}>
                  {l.locationName}
                </option>
              ))}
            </Select>
          </Card>
          {locationId ? (
            <Card className="p-0">
              <div className="p-4">
                <DataTable
                  columns={levelColumns}
                  rows={levels}
                  rowKey={(l) => l.stockLevelId}
                  isLoading={levelsLoading}
                  isError={levelsError}
                  onRetry={refetchLevels}
                  emptyMessage="ไม่มีข้อมูลคงเหลือของสถานที่นี้"
                />
              </div>
            </Card>
          ) : (
            <p className="text-sm text-slate-400">กรุณาเลือกสถานที่เพื่อดูยอดคงเหลือ</p>
          )}
        </>
      )}
    </div>
  )
}
