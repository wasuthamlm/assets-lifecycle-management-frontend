import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, ShieldCheck } from 'lucide-react'
import { useUsersQuery } from '@/hooks/useUsers'
import { useRolesQuery } from '@/hooks/useRolesPermissions'
import { useAssignEmployeeRolesMutation } from '@/hooks/useEmployees'
import { useCurrentUser } from '@/hooks/useAuth'
import { usePermission } from '@/hooks/usePermission'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { translateRoleName } from '@/lib/roleLabels'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'
import type { Role } from '@/api/types/roles-permissions.types'
import type { User } from '@/api/types/user.types'

interface AssignRolesModalProps {
  user: User
  roles: Role[]
  onClose: () => void
}

function AssignRolesModal({ user, roles, onClose }: AssignRolesModalProps) {
  const currentRoleIds = user.employee?.employeeRoles?.map((er) => er.roleId) ?? []
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(currentRoleIds))
  const assignMutation = useAssignEmployeeRolesMutation()

  function toggle(roleId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  function handleSubmit() {
    if (!user.employeeId) {
      toast.error('บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน จึงกำหนดบทบาทไม่ได้')
      return
    }
    assignMutation.mutate(
      { employeeId: user.employeeId, dto: { roleIds: Array.from(selectedIds) } },
      {
        onSuccess: () => {
          toast.success('บันทึกสิทธิ์เรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(getErrorMessage(e, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  const hasChanges =
    selectedIds.size !== currentRoleIds.length || currentRoleIds.some((id) => !selectedIds.has(id))

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.employee?.fullName ?? user.username}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>เลือกแล้ว {selectedIds.size}/{roles.length}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedIds(new Set(roles.map((r) => r.roleId)))}
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

      <div className="space-y-2">
        {roles.map((role) => {
          const checked = selectedIds.has(role.roleId)
          return (
            <label
              key={role.roleId}
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
                onChange={() => toggle(role.roleId)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{translateRoleName(role.roleName)}</p>
                <p className="text-xs text-slate-400">{role.roleName}</p>
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

export function UsersListPage() {
  usePageTitle('บัญชีผู้ใช้งาน')
  const { data: users = [], isLoading, isError, refetch } = useUsersQuery()
  const { data: roles = [] } = useRolesQuery()
  const { data: currentUser } = useCurrentUser()
  const { hasPermission } = usePermission()
  const canManageRbac = hasPermission('rbac.manage')
  const [search, setSearch] = useState('')
  const [managing, setManaging] = useState<User | null>(null)

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      (u.employee?.fullName.toLowerCase().includes(q) ?? false) ||
      (u.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      header: 'ชื่อ',
      render: (u) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{u.username}</p>
          {u.employee?.fullName && <p className="text-xs text-slate-400">{u.employee.fullName}</p>}
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => u.email ?? '-' },
    {
      key: 'roles',
      header: 'Roles',
      render: (u) => {
        const userRoles = u.employee?.employeeRoles ?? []
        if (userRoles.length === 0) return <span className="text-xs text-slate-400">ยังไม่ได้กำหนด</span>
        return (
          <div className="flex flex-wrap gap-1.5">
            {userRoles.map((er) => (
              <span
                key={er.roleId}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {er.role ? translateRoleName(er.role.roleName) : er.roleId}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (u) => (
        <span className={u.isActive ? 'text-emerald-600' : 'text-slate-400'}>{u.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
      ),
    },
    {
      key: 'action',
      header: 'การจัดการ',
      className: 'text-right',
      render: (u) => {
        const isSelf = currentUser?.userId === u.userId
        if (!canManageRbac) return null
        if (isSelf) {
          return (
            <span className="ml-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Lock size={13} /> บัญชีของคุณ
            </span>
          )
        }
        return (
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => setManaging(u)}>
              <ShieldCheck size={14} /> จัดการสิทธิ์
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อผู้ใช้ / พนักงาน / อีเมล..."
          className="max-w-xs"
        />
      </div>
      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(u) => u.userId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>
      </Card>

      <Modal open={!!managing} onClose={() => setManaging(null)} title="จัดการสิทธิ์" overlay="none">
        {managing && <AssignRolesModal user={managing} roles={roles} onClose={() => setManaging(null)} />}
      </Modal>
    </div>
  )
}
