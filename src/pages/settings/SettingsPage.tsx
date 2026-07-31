import { useState } from 'react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { ChevronRight, CornerDownRight, LogOut, Moon, Plus, Pencil, Sun, Trash2, User } from 'lucide-react'
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
  useCreateCompanyMutation,
  useCreateLocationMutation,
  useDeleteAllowedDomainMutation,
  useDeleteAssetCategoryMutation,
  useDeleteLocationMutation,
  useDepartmentsQuery,
  useLocationsQuery,
  useUpdateAllowedDomainMutation,
  useUpdateAssetCategoryMutation,
  useUpdateLocationMutation,
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

type Tab = 'profile' | 'companies' | 'departments' | 'locations' | 'categories' | 'vendors'

function errorMessage(error: unknown): string {
  const message =
    error instanceof AxiosError ? ((error.response?.data as ApiErrorShape | undefined)?.message ?? 'บันทึกไม่สำเร็จ') : 'บันทึกไม่สำเร็จ'
  return Array.isArray(message) ? message.join(', ') : message
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

interface AddCompanyFormProps {
  onClose: () => void
}

function AddCompanyForm({ onClose }: AddCompanyFormProps) {
  const [companyCode, setCompanyCode] = useState('')
  const [companyName, setCompanyName] = useState('')
  const createMutation = useCreateCompanyMutation()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyCode.trim() || !companyName.trim()) {
      toast.error('กรุณากรอกรหัสและชื่อบริษัทให้ครบ')
      return
    }
    createMutation.mutate(
      { companyCode: companyCode.trim(), companyName: companyName.trim() },
      {
        onSuccess: () => {
          toast.success('เพิ่มบริษัทเรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        ตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน — รหัสบริษัทต้องไม่ซ้ำกับที่มีอยู่แล้ว
      </p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">รหัสบริษัท</label>
        <Input value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} placeholder="เช่น MLM" autoFocus />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อบริษัท</label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="เช่น Millimed Co., Ltd." />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันเพิ่มบริษัท'}
        </Button>
      </div>
    </form>
  )
}

interface CompaniesPanelProps {
  companies: Company[]
  isLoading: boolean
}

function CompaniesPanel({ companies, isLoading }: CompaniesPanelProps) {
  const [addOpen, setAddOpen] = useState(false)

  const columns: DataTableColumn<Company>[] = [
    { key: 'code', header: 'รหัสบริษัท', render: (c) => c.companyCode },
    { key: 'name', header: 'ชื่อบริษัท', render: (c) => c.companyName },
  ]

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">รายชื่อบริษัท</h3>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} /> เพิ่มบริษัท
        </Button>
      </div>
      <div className="px-4 pb-4">
        <DataTable columns={columns} rows={companies} rowKey={(c) => c.companyId} isLoading={isLoading} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="เพิ่มบริษัทใหม่" overlay="none">
        <AddCompanyForm onClose={() => setAddOpen(false)} />
      </Modal>
    </Card>
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
      className: 'text-right',
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="แก้ไขโดเมน" overlay="none">
        {editing && <DomainEditForm companies={companies} editing={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}

function RowActionButton({
  icon: Icon,
  onClick,
  title,
  variant = 'default',
}: {
  icon: typeof Pencil
  onClick: () => void
  title: string
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800',
        variant === 'danger' ? 'hover:text-red-600' : 'hover:text-brand-600',
      )}
    >
      <Icon size={15} />
    </button>
  )
}

interface CategoryRowProps {
  category: AssetCategory
  categories: AssetCategory[]
  isChild?: boolean
  expandable?: boolean
  expanded?: boolean
  childCount?: number
  onToggleExpand?: () => void
}

function CategoryRow({ category, categories, isChild, expandable, expanded, childCount, onToggleExpand }: CategoryRowProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.categoryName)
  const [assetType, setAssetType] = useState(category.assetType ?? '')
  const [parentCategoryId, setParentCategoryId] = useState(category.parentCategoryId ? String(category.parentCategoryId) : '')
  const updateMutation = useUpdateAssetCategoryMutation(category.categoryId)
  const deleteMutation = useDeleteAssetCategoryMutation()

  function startEdit() {
    setName(category.categoryName)
    setAssetType(category.assetType ?? '')
    setParentCategoryId(category.parentCategoryId ? String(category.parentCategoryId) : '')
    setEditing(true)
  }

  function save() {
    if (!name.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่')
      return
    }
    updateMutation.mutate(
      { categoryName: name.trim(), assetType: assetType.trim() || undefined, parentCategoryId: parentCategoryId ? Number(parentCategoryId) : undefined },
      {
        onSuccess: () => {
          toast.success('บันทึกแล้ว')
          setEditing(false)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  function remove() {
    if (!window.confirm(`ลบหมวดหมู่ "${category.categoryName}" ใช่หรือไม่?`)) return
    deleteMutation.mutate(category.categoryId, {
      onSuccess: () => toast.success('ลบหมวดหมู่เรียบร้อยแล้ว'),
      onError: (e) => toast.error(errorMessage(e)),
    })
  }

  const parentOptions = categories.filter((c) => !c.parentCategoryId && c.categoryId !== category.categoryId)

  if (editing) {
    return (
      <div className={cn('space-y-2 rounded-lg border border-brand-200 bg-brand-50/40 p-2.5 dark:border-brand-500/30 dark:bg-brand-500/5', isChild && 'ml-6')}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อหมวดหมู่" autoFocus />
        <div className="grid grid-cols-2 gap-2">
          <Input value={assetType} onChange={(e) => setAssetType(e.target.value)} placeholder="ประเภททรัพย์สิน (ถ้ามี)" />
          <Select value={parentCategoryId} onChange={(e) => setParentCategoryId(e.target.value)}>
            <option value="">ไม่มี (หมวดหมู่หลัก)</option>
            {parentOptions.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-1.5">
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={save} disabled={updateMutation.isPending}>
            บันทึก
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60', isChild && 'ml-6')}>
      {expandable ? (
        <button type="button" onClick={onToggleExpand} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {isChild && <CornerDownRight size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />}
          <ChevronRight
            size={16}
            className={cn('shrink-0 text-slate-400 transition-transform duration-200', expanded && 'rotate-90')}
          />
          <div className="min-w-0">
            <p className={cn('truncate', isChild ? 'text-sm text-slate-700 dark:text-slate-200' : 'font-medium text-slate-800 dark:text-slate-100')}>
              {category.categoryName}
              {!!childCount && <span className="ml-1.5 text-xs font-normal text-slate-400">({childCount} หมวดย่อย)</span>}
            </p>
            {category.assetType && <p className="truncate text-xs text-slate-400">{category.assetType}</p>}
          </div>
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-2">
          {isChild && <CornerDownRight size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />}
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-700 dark:text-slate-200">{category.categoryName}</p>
            {category.assetType && <p className="truncate text-xs text-slate-400">{category.assetType}</p>}
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        <RowActionButton icon={Pencil} title="แก้ไข" onClick={startEdit} />
        <RowActionButton icon={Trash2} title="ลบ" variant="danger" onClick={remove} />
      </div>
    </div>
  )
}

function CategorySubAddRow({ parentId, parentName }: { parentId: number; parentName: string }) {
  const [name, setName] = useState('')
  const createMutation = useCreateAssetCategoryMutation()

  function handleAdd() {
    if (!name.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่ย่อย')
      return
    }
    createMutation.mutate(
      { categoryName: name.trim(), parentCategoryId: parentId },
      {
        onSuccess: () => {
          toast.success('เพิ่มหมวดหมู่ย่อยเรียบร้อยแล้ว')
          setName('')
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <div className="ml-6 flex items-center gap-2 py-1.5 pr-1">
      <CornerDownRight size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={`เพิ่มหมวดหมู่ย่อยของ "${parentName}"`}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={createMutation.isPending}
        title="เพิ่ม"
        className="shrink-0 rounded-lg p-2 text-brand-600 transition-colors duration-200 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

interface CategoryManagerProps {
  categories: AssetCategory[]
  isLoading: boolean
}

function CategoryManager({ categories, isLoading }: CategoryManagerProps) {
  const [newName, setNewName] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const createMutation = useCreateAssetCategoryMutation()

  const roots = categories.filter((c) => !c.parentCategoryId)
  const childrenOf = (parentId: number) => categories.filter((c) => c.parentCategoryId === parentId)

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAdd() {
    if (!newName.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่')
      return
    }
    createMutation.mutate(
      { categoryName: newName.trim() },
      {
        onSuccess: () => {
          toast.success('เพิ่มหมวดหมู่เรียบร้อยแล้ว')
          setNewName('')
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <Card className="p-0">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">จัดการหมวดหมู่ทรัพย์สิน</h3>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="ชื่อหมวดหมู่หลักใหม่"
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={createMutation.isPending}>
            <Plus size={16} /> เพิ่ม
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          กดลูกศร <ChevronRight size={12} className="inline align-[-1px]" /> ที่หมวดหมู่หลักด้านล่างเพื่อดู/เพิ่มหมวดหมู่ย่อย
        </p>
      </div>
      <div className="max-h-[32rem] space-y-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : roots.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีหมวดหมู่ทรัพย์สิน — เริ่มเพิ่มได้จากด้านบน</p>
        ) : (
          roots.map((root) => {
            const kids = childrenOf(root.categoryId)
            const isOpen = expandedIds.has(root.categoryId)
            return (
              <div key={root.categoryId}>
                <CategoryRow
                  category={root}
                  categories={categories}
                  expandable
                  expanded={isOpen}
                  childCount={kids.length}
                  onToggleExpand={() => toggleExpand(root.categoryId)}
                />
                {isOpen && (
                  <div className="pb-1">
                    {kids.map((child) => (
                      <CategoryRow key={child.categoryId} category={child} categories={categories} isChild />
                    ))}
                    <CategorySubAddRow parentId={root.categoryId} parentName={root.categoryName} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

interface LocationRowProps {
  location: Location
  companies: Company[]
}

function LocationRow({ location, companies }: LocationRowProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(location.locationName)
  const [type, setType] = useState(location.locationType ?? '')
  const [site, setSite] = useState(location.site ?? '')
  const [companyId, setCompanyId] = useState(location.companyId ? String(location.companyId) : '')
  const updateMutation = useUpdateLocationMutation()
  const deleteMutation = useDeleteLocationMutation()

  function startEdit() {
    setName(location.locationName)
    setType(location.locationType ?? '')
    setSite(location.site ?? '')
    setCompanyId(location.companyId ? String(location.companyId) : '')
    setEditing(true)
  }

  function save() {
    if (!name.trim()) {
      toast.error('กรุณากรอกชื่อสถานที่')
      return
    }
    updateMutation.mutate(
      {
        id: location.locationId,
        dto: {
          locationName: name.trim(),
          locationType: type.trim() || undefined,
          site: site.trim() || undefined,
          companyId: companyId ? Number(companyId) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('บันทึกแล้ว')
          setEditing(false)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  function remove() {
    if (!window.confirm(`ลบสถานที่ "${location.locationName}" ใช่หรือไม่?`)) return
    deleteMutation.mutate(location.locationId, {
      onSuccess: () => toast.success('ลบสถานที่เรียบร้อยแล้ว'),
      onError: (e) => toast.error(errorMessage(e)),
    })
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg border border-brand-200 bg-brand-50/40 p-2.5 dark:border-brand-500/30 dark:bg-brand-500/5">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อสถานที่" autoFocus />
        <div className="grid grid-cols-2 gap-2">
          <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="ประเภท" />
          <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="ไซต์งาน" />
        </div>
        <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="">ไม่ระบุบริษัท</option>
          {companies.map((c) => (
            <option key={c.companyId} value={c.companyId}>
              {c.companyName}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-1.5">
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={save} disabled={updateMutation.isPending}>
            บันทึก
          </Button>
        </div>
      </div>
    )
  }

  const companyName = companies.find((c) => c.companyId === location.companyId)?.companyName
  const subtitle = [location.locationType, location.site, companyName].filter(Boolean).join(' · ')

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-700 dark:text-slate-200">{location.locationName}</p>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <RowActionButton icon={Pencil} title="แก้ไข" onClick={startEdit} />
        <RowActionButton icon={Trash2} title="ลบ" variant="danger" onClick={remove} />
      </div>
    </div>
  )
}

interface LocationManagerProps {
  locations: Location[]
  companies: Company[]
  isLoading: boolean
}

function LocationManager({ locations, companies, isLoading }: LocationManagerProps) {
  const [newName, setNewName] = useState('')
  const createMutation = useCreateLocationMutation()

  function handleAdd() {
    if (!newName.trim()) {
      toast.error('กรุณากรอกชื่อสถานที่')
      return
    }
    createMutation.mutate(
      { locationName: newName.trim() },
      {
        onSuccess: () => {
          toast.success('เพิ่มสถานที่เรียบร้อยแล้ว')
          setNewName('')
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <Card className="p-0">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">จัดการสถานที่</h3>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="ชื่อสถานที่ใหม่"
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={createMutation.isPending}>
            <Plus size={16} /> เพิ่ม
          </Button>
        </div>
      </div>
      <div className="max-h-[32rem] overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : locations.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีสถานที่ — เริ่มเพิ่มได้จากด้านบน</p>
        ) : (
          locations.map((l) => <LocationRow key={l.locationId} location={l} companies={companies} />)
        )}
      </div>
    </Card>
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

  const { data: companies = [], isLoading: companiesLoading } = useCompaniesQuery()
  const { data: departments = [], isLoading: departmentsLoading } = useDepartmentsQuery()
  const { data: locations = [], isLoading: locationsLoading } = useLocationsQuery()
  const { data: categories = [], isLoading: categoriesLoading } = useAssetCategoriesQuery()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendorsQuery()

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'โปรไฟล์ของฉัน' },
    ...(canManageMasterData
      ? ([
          { key: 'companies', label: 'บริษัท / โดเมน' },
          { key: 'departments', label: 'แผนก' },
          { key: 'locations', label: 'สถานที่' },
          { key: 'categories', label: 'หมวดหมู่ทรัพย์สิน' },
          { key: 'vendors', label: 'ผู้ขาย/ผู้ให้บริการ' },
        ] as { key: Tab; label: string }[])
      : []),
  ]

  const departmentColumns: DataTableColumn<Department>[] = [
    { key: 'name', header: 'ชื่อแผนก', render: (d) => d.departmentName },
    { key: 'site', header: 'ไซต์งาน', render: (d) => d.site ?? '-' },
  ]

  const vendorColumns: DataTableColumn<Vendor>[] = [
    { key: 'name', header: 'ชื่อผู้ขาย', render: (v) => v.vendorName },
    { key: 'type', header: 'ประเภท', render: (v) => v.vendorType ?? '-' },
    { key: 'contact', header: 'ข้อมูลติดต่อ', render: (v) => v.contactInfo ?? '-' },
  ]

  return (
    <div className="space-y-4">
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

      {tab === 'profile' && <ProfileTab />}

      {tab !== 'profile' && canManageMasterData && (
        <>
          {tab === 'companies' && (
            <div className="space-y-4">
              <CompaniesPanel companies={companies} isLoading={companiesLoading} />
              <Card className="p-0">
                <div className="p-4">
                  <DomainsPanel companies={companies} />
                </div>
              </Card>
            </div>
          )}

          {tab === 'locations' && <LocationManager locations={locations} companies={companies} isLoading={locationsLoading} />}

          {tab === 'categories' && <CategoryManager categories={categories} isLoading={categoriesLoading} />}

          {tab !== 'companies' && tab !== 'locations' && tab !== 'categories' && (
            <Card className="p-0">
              <div className="p-4">
                {tab === 'departments' && (
                  <DataTable columns={departmentColumns} rows={departments} rowKey={(d) => d.departmentId} isLoading={departmentsLoading} />
                )}
                {tab === 'vendors' && (
                  <DataTable columns={vendorColumns} rows={vendors} rowKey={(v) => v.vendorId} isLoading={vendorsLoading} />
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
