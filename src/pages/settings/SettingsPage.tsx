import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { LogOut, Moon, Plus, Pencil, Sun, Trash2, User } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useAuth'
import { useLogoutFlow } from '@/hooks/useLogoutFlow'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import {
  useAllowedDomainsQuery,
  useAssetCategoriesQuery,
  useCompaniesQuery,
  useCreateAllowedDomainMutation,
  useCreateAssetCategoryMutation,
  useDeleteAllowedDomainMutation,
  useDeleteAssetCategoryMutation,
  useDepartmentsQuery,
  useLocationsQuery,
  useUpdateAllowedDomainMutation,
  useUpdateAssetCategoryMutation,
  useVendorsQuery,
} from '@/hooks/useMasterData'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Spinner } from '@/components/ui/Spinner'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { applyTheme, useUiStore } from '@/stores/ui.store'
import { cn } from '@/lib/utils'
import { formatThaiDate } from '@/lib/formatters'
import type { AllowedDomain, AssetCategory, Company, Location, Vendor } from '@/api/types/master-data.types'
import type { ApiErrorShape } from '@/api/types/common.types'
import type { Department } from '@/api/types/employee.types'

type Tab = 'profile' | 'companies' | 'departments' | 'locations' | 'categories' | 'vendors' | 'domains'

function errorMessage(error: unknown): string {
  const message =
    error instanceof AxiosError ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'บันทึกไม่สำเร็จ') : 'บันทึกไม่สำเร็จ'
  return Array.isArray(message) ? message.join(', ') : message
}

interface CategoryFormProps {
  categories: AssetCategory[]
  editing: AssetCategory | null
  onClose: () => void
}

function CategoryForm({ categories, editing, onClose }: CategoryFormProps) {
  const [categoryName, setCategoryName] = useState(editing?.categoryName ?? '')
  const [assetType, setAssetType] = useState(editing?.assetType ?? '')
  const [parentCategoryId, setParentCategoryId] = useState(
    editing?.parentCategoryId ? String(editing.parentCategoryId) : '',
  )

  useEffect(() => {
    setCategoryName(editing?.categoryName ?? '')
    setAssetType(editing?.assetType ?? '')
    setParentCategoryId(editing?.parentCategoryId ? String(editing.parentCategoryId) : '')
  }, [editing])

  const createMutation = useCreateAssetCategoryMutation()
  const updateMutation = useUpdateAssetCategoryMutation(editing?.categoryId ?? 0)
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryName.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่')
      return
    }
    const dto = {
      categoryName: categoryName.trim(),
      assetType: assetType.trim() || undefined,
      parentCategoryId: parentCategoryId ? Number(parentCategoryId) : undefined,
    }
    if (editing) {
      updateMutation.mutate(dto, {
        onSuccess: () => {
          toast.success('แก้ไขหมวดหมู่เรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(errorMessage(e)),
      })
    } else {
      createMutation.mutate(dto, {
        onSuccess: () => {
          toast.success('เพิ่มหมวดหมู่เรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(errorMessage(e)),
      })
    }
  }

  const parentOptions = categories.filter((c) => c.categoryId !== editing?.categoryId)

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อหมวดหมู่</label>
        <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="เช่น Laptop, มือถือ" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ประเภททรัพย์สิน</label>
        <Input value={assetType} onChange={(e) => setAssetType(e.target.value)} placeholder="เช่น hardware, license, vehicle" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">หมวดหมู่หลัก (ถ้ามี)</label>
        <Select value={parentCategoryId} onChange={(e) => setParentCategoryId(e.target.value)}>
          <option value="">ไม่มี</option>
          {parentOptions.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.categoryName}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังบันทึก...' : editing ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
        </Button>
      </div>
    </form>
  )
}

interface DomainEditFormProps {
  companies: Company[]
  editing: AllowedDomain
  onClose: () => void
}

function DomainEditForm({ companies, editing, onClose }: DomainEditFormProps) {
  const [domain, setDomain] = useState(editing.domain)
  const [companyId, setCompanyId] = useState(editing.companyId ? String(editing.companyId) : '')
  const updateMutation = useUpdateAllowedDomainMutation()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim()) {
      toast.error('กรุณากรอกโดเมน')
      return
    }
    updateMutation.mutate(
      { id: editing.allowedDomainId, dto: { domain: domain.trim(), companyId: companyId ? Number(companyId) : undefined } },
      {
        onSuccess: () => {
          toast.success('แก้ไขโดเมนเรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">โดเมน</label>
        <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="เช่น millimedthailand.com" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">บริษัท</label>
        <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="">ไม่ระบุ</option>
          {companies.map((c) => (
            <option key={c.companyId} value={c.companyId}>
              {c.companyName}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
        </Button>
      </div>
    </form>
  )
}

interface DomainsPanelProps {
  companies: Company[]
}

function DomainsPanel({ companies }: DomainsPanelProps) {
  const { data: domains = [], isLoading } = useAllowedDomainsQuery()
  const createMutation = useCreateAllowedDomainMutation()
  const updateMutation = useUpdateAllowedDomainMutation()
  const deleteMutation = useDeleteAllowedDomainMutation()
  const [domainInput, setDomainInput] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [editing, setEditing] = useState<AllowedDomain | null>(null)

  function handleAdd() {
    if (!domainInput.trim()) {
      toast.error('กรุณากรอกโดเมน')
      return
    }
    createMutation.mutate(
      { domain: domainInput.trim(), companyId: companyId ? Number(companyId) : undefined },
      {
        onSuccess: () => {
          toast.success('เพิ่มโดเมนเรียบร้อยแล้ว')
          setDomainInput('')
          setCompanyId('')
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  function handleToggle(d: AllowedDomain, isEnabled: boolean) {
    updateMutation.mutate(
      { id: d.allowedDomainId, dto: { isEnabled } },
      { onError: (e) => toast.error(errorMessage(e)) },
    )
  }

  function handleDelete(d: AllowedDomain) {
    if (!window.confirm(`ลบโดเมน "${d.domain}" ใช่หรือไม่?`)) return
    deleteMutation.mutate(d.allowedDomainId, {
      onSuccess: () => toast.success('ลบโดเมนเรียบร้อยแล้ว'),
      onError: (e) => toast.error(errorMessage(e)),
    })
  }

  const columns: DataTableColumn<AllowedDomain>[] = [
    { key: 'domain', header: 'โดเมน', render: (d) => d.domain },
    { key: 'company', header: 'บริษัท', render: (d) => d.company?.companyName ?? '-' },
    {
      key: 'enabled',
      header: 'เปิดใช้งาน',
      render: (d) => <Switch checked={d.isEnabled} onChange={(v) => handleToggle(d, v)} disabled={updateMutation.isPending} />,
    },
    { key: 'createdAt', header: 'สร้างเมื่อ', render: (d) => formatThaiDate(d.createdAt) },
    {
      key: 'action',
      header: 'จัดการ',
      render: (d) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(d)}
            className="rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(d)}
            className="rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">จัดการโดเมนที่อนุญาต</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          เฉพาะอีเมลที่มีโดเมนอยู่ในรายการนี้ (และเปิดใช้งานอยู่) จึงจะเข้าใช้งานระบบผ่าน Microsoft SSO ได้ — จัดการได้เฉพาะ admin
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="โดเมน (เช่น millimedthailand.com)"
          className="max-w-xs"
        />
        <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="max-w-xs">
          <option value="">ไม่ระบุ</option>
          {companies.map((c) => (
            <option key={c.companyId} value={c.companyId}>
              {c.companyName}
            </option>
          ))}
        </Select>
        <Button onClick={handleAdd} disabled={createMutation.isPending}>
          <Plus size={16} /> เพิ่ม
        </Button>
      </div>
      <DataTable columns={columns} rows={domains} rowKey={(d) => d.allowedDomainId} isLoading={isLoading} />

      <Modal open={!!editing} onClose={() => setEditing(null)} title="แก้ไขโดเมน">
        {editing && <DomainEditForm companies={companies} editing={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}

function ProfileTab() {
  const { data: user, isLoading } = useCurrentUser()
  const { handleLogout, isPending, modal } = useLogoutFlow()
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <User size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {user.employee?.fullName ?? user.username}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.employee?.position ?? user.username}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">ชื่อผู้ใช้</dt>
            <dd className="text-slate-700 dark:text-slate-200">{user.username}</dd>
          </div>
          <div>
            <dt className="text-slate-400">อีเมล</dt>
            <dd className="text-slate-700 dark:text-slate-200">{user.email ?? '-'}</dd>
          </div>
          {user.employee?.employeeCode && (
            <div>
              <dt className="text-slate-400">รหัสพนักงาน</dt>
              <dd className="text-slate-700 dark:text-slate-200">{user.employee.employeeCode}</dd>
            </div>
          )}
          {user.employee?.department && (
            <div>
              <dt className="text-slate-400">แผนก</dt>
              <dd className="text-slate-700 dark:text-slate-200">{user.employee.department.departmentName}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">สิทธิ์การใช้งาน</h3>
        {user.permissions.length === 0 ? (
          <p className="text-sm text-slate-400">ไม่มีสิทธิ์พิเศษ</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((p) => (
              <span
                key={p}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">ธีมสี</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ธีมปัจจุบัน: {theme === 'light' ? 'สว่าง' : 'มืด'}
          </p>
          <Button variant="secondary" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            สลับธีม
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">บัญชี</h3>
        <Button variant="danger" onClick={handleLogout} disabled={isPending}>
          <LogOut size={16} />
          ออกจากระบบ
        </Button>
      </Card>
      {modal}
    </div>
  )
}

export function SettingsPage() {
  usePageTitle('ตั้งค่า')
  const { hasPermission } = usePermission()
  const canManageMasterData = hasPermission('master.manage')
  const [tab, setTab] = useState<Tab>('profile')
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null)

  const { data: companies = [], isLoading: companiesLoading } = useCompaniesQuery()
  const { data: departments = [], isLoading: departmentsLoading } = useDepartmentsQuery()
  const { data: locations = [], isLoading: locationsLoading } = useLocationsQuery()
  const { data: categories = [], isLoading: categoriesLoading } = useAssetCategoriesQuery()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendorsQuery()
  const deleteMutation = useDeleteAssetCategoryMutation()

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'โปรไฟล์ของฉัน' },
    ...(canManageMasterData
      ? ([
          { key: 'companies', label: 'บริษัท' },
          { key: 'departments', label: 'แผนก' },
          { key: 'locations', label: 'สถานที่' },
          { key: 'categories', label: 'หมวดหมู่ทรัพย์สิน' },
          { key: 'vendors', label: 'ผู้ขาย/ผู้ให้บริการ' },
          { key: 'domains', label: 'จัดการโดเมน' },
        ] as { key: Tab; label: string }[])
      : []),
  ]

  function openCreateCategory() {
    setEditingCategory(null)
    setCategoryFormOpen(true)
  }

  function openEditCategory(category: AssetCategory) {
    setEditingCategory(category)
    setCategoryFormOpen(true)
  }

  function handleDeleteCategory(category: AssetCategory) {
    if (!window.confirm(`ลบหมวดหมู่ "${category.categoryName}" ใช่หรือไม่?`)) return
    deleteMutation.mutate(category.categoryId, {
      onSuccess: () => toast.success('ลบหมวดหมู่เรียบร้อยแล้ว'),
      onError: (e) => toast.error(errorMessage(e)),
    })
  }

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
    {
      key: 'parent',
      header: 'หมวดหมู่หลัก',
      render: (c) => categories.find((p) => p.categoryId === c.parentCategoryId)?.categoryName ?? '-',
    },
    {
      key: 'action',
      header: '',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openEditCategory(c)}
            className="rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCategory(c)}
            className="rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  const vendorColumns: DataTableColumn<Vendor>[] = [
    { key: 'name', header: 'ชื่อผู้ขาย', render: (v) => v.vendorName },
    { key: 'type', header: 'ประเภท', render: (v) => v.vendorType ?? '-' },
    { key: 'contact', header: 'ข้อมูลติดต่อ', render: (v) => v.contactInfo ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
          {TABS.map((t) => (
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
        {tab === 'categories' && (
          <Button onClick={openCreateCategory}>
            <Plus size={16} /> เพิ่มหมวดหมู่
          </Button>
        )}
      </div>

      {tab === 'profile' && <ProfileTab />}

      {tab !== 'profile' && canManageMasterData && (
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
            {tab === 'domains' && <DomainsPanel companies={companies} />}
          </div>
        </Card>
      )}

      <Modal
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        title={editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ทรัพย์สิน'}
      >
        <CategoryForm categories={categories} editing={editingCategory} onClose={() => setCategoryFormOpen(false)} />
      </Modal>
    </div>
  )
}
