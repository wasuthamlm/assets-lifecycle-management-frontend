import { useState } from 'react'
import {
  useAssetCategoriesQuery,
  useCompaniesQuery,
  useDepartmentsQuery,
  useLocationsQuery,
  useVendorsQuery,
} from '@/hooks/useMasterData'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { cn } from '@/lib/utils'
import type { AssetCategory, Company, Location, Vendor } from '@/api/types/master-data.types'
import type { Department } from '@/api/types/employee.types'

type Tab = 'companies' | 'departments' | 'locations' | 'categories' | 'vendors'

const TABS: { key: Tab; label: string }[] = [
  { key: 'companies', label: 'บริษัท' },
  { key: 'departments', label: 'แผนก' },
  { key: 'locations', label: 'สถานที่' },
  { key: 'categories', label: 'หมวดหมู่ทรัพย์สิน' },
  { key: 'vendors', label: 'ผู้ขาย/ผู้ให้บริการ' },
]

export function MasterDataPage() {
  usePageTitle('ข้อมูลหลัก')
  const [tab, setTab] = useState<Tab>('companies')

  const { data: companies = [], isLoading: companiesLoading } = useCompaniesQuery()
  const { data: departments = [], isLoading: departmentsLoading } = useDepartmentsQuery()
  const { data: locations = [], isLoading: locationsLoading } = useLocationsQuery()
  const { data: categories = [], isLoading: categoriesLoading } = useAssetCategoriesQuery()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendorsQuery()

  const companyColumns: DataTableColumn<Company>[] = [
    { key: 'name', header: 'ชื่อบริษัท', render: (c) => c.companyName },
  ]

  const departmentColumns: DataTableColumn<Department>[] = [
    { key: 'name', header: 'ชื่อแผนก', render: (d) => d.departmentName },
    { key: 'site', header: 'ไซต์งาน', render: (d) => d.site ?? '-' },
  ]

  const locationColumns: DataTableColumn<Location>[] = [
    { key: 'name', header: 'ชื่อสถานที่', render: (l) => l.locationName },
    { key: 'type', header: 'ประเภท', render: (l) => l.locationType ?? '-' },
    { key: 'site', header: 'ไซต์งาน', render: (l) => l.site ?? '-' },
  ]

  const categoryColumns: DataTableColumn<AssetCategory>[] = [
    { key: 'name', header: 'ชื่อหมวดหมู่', render: (c) => c.categoryName },
    { key: 'type', header: 'ประเภททรัพย์สิน', render: (c) => c.assetType ?? '-' },
  ]

  const vendorColumns: DataTableColumn<Vendor>[] = [
    { key: 'name', header: 'ชื่อผู้ขาย', render: (v) => v.vendorName },
    { key: 'type', header: 'ประเภท', render: (v) => v.vendorType ?? '-' },
    { key: 'contact', header: 'ข้อมูลติดต่อ', render: (v) => v.contactInfo ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200',
              tab === t.key
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        <div className="p-4">
          {tab === 'companies' && (
            <DataTable columns={companyColumns} rows={companies} rowKey={(c) => c.companyId} isLoading={companiesLoading} />
          )}
          {tab === 'departments' && (
            <DataTable columns={departmentColumns} rows={departments} rowKey={(d) => d.departmentId} isLoading={departmentsLoading} />
          )}
          {tab === 'locations' && (
            <DataTable columns={locationColumns} rows={locations} rowKey={(l) => l.locationId} isLoading={locationsLoading} />
          )}
          {tab === 'categories' && (
            <DataTable columns={categoryColumns} rows={categories} rowKey={(c) => c.categoryId} isLoading={categoriesLoading} />
          )}
          {tab === 'vendors' && (
            <DataTable columns={vendorColumns} rows={vendors} rowKey={(v) => v.vendorId} isLoading={vendorsLoading} />
          )}
        </div>
      </Card>
    </div>
  )
}
