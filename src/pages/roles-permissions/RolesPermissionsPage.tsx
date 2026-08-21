import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, ShieldCheck } from 'lucide-react'
import {
  useRolesQuery,
  usePermissionsQuery,
  useCreateRoleMutation,
  useAssignPermissionsToRoleMutation,
} from '@/hooks/useRolesPermissions'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { cn } from '@/lib/utils'
import { translatePermissionCode } from '@/lib/permissionLabels'
import { translateRoleName } from '@/lib/roleLabels'
import { getErrorMessage } from '@/lib/errorMessage'
import type { Permission, Role } from '@/api/types/roles-permissions.types'

type Tab = 'roles' | 'permissions'

function errorMessage(error: unknown): string {
  return getErrorMessage(error, 'บันทึกไม่สำเร็จ')
}

interface CreateRoleModalProps {
  onClose: () => void
}

function CreateRoleModal({ onClose }: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const createMutation = useCreateRoleMutation()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roleName.trim()) {
      toast.error('กรุณากรอกชื่อบทบาท (ภาษาอังกฤษ เช่น hr)')
      return
    }
    createMutation.mutate(
      { roleName: roleName.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('เพิ่มบทบาทเรียบร้อยแล้ว — ไปที่ "จัดการสิทธิ์" เพื่อเลือกสิทธิ์ของบทบาทนี้')
          onClose()
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อบทบาท (code)</label>
        <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="เช่น hr" autoFocus />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">คำอธิบาย</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="เช่น ฝ่ายบุคคล" />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'กำลังบันทึก...' : 'เพิ่มบทบาท'}
        </Button>
      </div>
    </form>
  )
}

interface AssignPermissionsModalProps {
  role: Role
  permissions: Permission[]
  onClose: () => void
}

function AssignPermissionsModal({ role, permissions, onClose }: AssignPermissionsModalProps) {
  const currentIds = role.rolePermissions?.map((rp) => rp.permissionId) ?? []
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(currentIds))
  const assignMutation = useAssignPermissionsToRoleMutation()

  function toggle(permissionId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })
  }

  function handleSubmit() {
    assignMutation.mutate(
      { roleId: role.roleId, dto: { permissionIds: Array.from(selectedIds) } },
      {
        onSuccess: () => {
          toast.success('บันทึกสิทธิ์เรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  const hasChanges = selectedIds.size !== currentIds.length || currentIds.some((id) => !selectedIds.has(id))

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{translateRoleName(role.roleName)}</p>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          เลือกแล้ว {selectedIds.size}/{permissions.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedIds(new Set(permissions.map((p) => p.permissionId)))}
            className="font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="font-medium text-slate-500 hover:underline dark:text-slate-400"
          >
            ล้างทั้งหมด
          </button>
        </div>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {permissions.map((permission) => {
          const checked = selectedIds.has(permission.permissionId)
          return (
            <label
              key={permission.permissionId}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150',
                checked
                  ? 'border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(permission.permissionId)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{translatePermissionCode(permission.permissionCode)}</p>
                <p className="font-mono text-xs text-slate-400">{permission.permissionCode}</p>
              </div>
            </label>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="text-xs text-slate-400">{hasChanges ? 'มีการเปลี่ยนแปลงที่ยังไม่บันทึก' : 'ยังไม่มีการเปลี่ยนแปลง'}</span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={assignMutation.isPending || !hasChanges}>
            {assignMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function RolesPermissionsPage() {
  usePageTitle('สิทธิ์การใช้งาน')
  const [tab, setTab] = useState<Tab>('roles')
  const { data: roles = [], isLoading: rolesLoading } = useRolesQuery()
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissionsQuery()
  const [creatingRole, setCreatingRole] = useState(false)
  const [managingRole, setManagingRole] = useState<Role | null>(null)

  const roleColumns: DataTableColumn<Role>[] = [
    {
      key: 'name',
      header: 'ชื่อบทบาท',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{translateRoleName(r.roleName)}</p>
          <p className="text-xs text-slate-400">{r.roleName}</p>
        </div>
      ),
    },
    { key: 'description', header: 'คำอธิบาย', render: (r) => r.description ?? '-' },
    { key: 'permissions', header: 'จำนวนสิทธิ์', render: (r) => `${r.rolePermissions?.length ?? 0} รายการ` },
    {
      key: 'action',
      header: 'การจัดการ',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => setManagingRole(r)}>
            <ShieldCheck size={14} /> จัดการสิทธิ์
          </Button>
        </div>
      ),
    },
  ]

  const permissionColumns: DataTableColumn<Permission>[] = [
    { key: 'code', header: 'รหัสสิทธิ์', render: (p) => <span className="font-mono text-xs">{p.permissionCode}</span> },
    { key: 'name', header: 'ชื่อสิทธิ์', render: (p) => translatePermissionCode(p.permissionCode) },
    { key: 'description', header: 'คำอธิบาย', render: (p) => p.description ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('roles')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200',
              tab === 'roles'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            บทบาท (Roles)
          </button>
          <button
            onClick={() => setTab('permissions')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200',
              tab === 'permissions'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            สิทธิ์การใช้งาน (Permissions)
          </button>
        </div>
        {tab === 'roles' && (
          <Button size="sm" onClick={() => setCreatingRole(true)}>
            <Plus size={16} /> เพิ่มบทบาท
          </Button>
        )}
      </div>

      <Card className="p-0">
        <div className="p-4">
          {tab === 'roles' && (
            <DataTable columns={roleColumns} rows={roles} rowKey={(r) => r.roleId} isLoading={rolesLoading} />
          )}
          {tab === 'permissions' && (
            <DataTable columns={permissionColumns} rows={permissions} rowKey={(p) => p.permissionId} isLoading={permissionsLoading} />
          )}
        </div>
      </Card>

      <Modal open={creatingRole} onClose={() => setCreatingRole(false)} title="เพิ่มบทบาทใหม่" overlay="none">
        <CreateRoleModal onClose={() => setCreatingRole(false)} />
      </Modal>

      <Modal open={!!managingRole} onClose={() => setManagingRole(null)} title="จัดการสิทธิ์" overlay="none">
        {managingRole && <AssignPermissionsModal role={managingRole} permissions={permissions} onClose={() => setManagingRole(null)} />}
      </Modal>
    </div>
  )
}
