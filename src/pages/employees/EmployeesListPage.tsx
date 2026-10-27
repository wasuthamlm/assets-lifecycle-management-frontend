import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, ShieldCheck, Trash2, UserPlus, Lock } from 'lucide-react'
import { useEmployeesQuery, useAssignEmployeeRolesMutation } from '@/hooks/useEmployees'
import { useUsersQuery } from '@/hooks/useUsers'
import {
  useDeleteRolePreassignmentMutation,
  useRolePreassignmentsQuery,
  useRolesQuery,
  useUpsertRolePreassignmentMutation,
} from '@/hooks/useRolesPermissions'
import { usePermission } from '@/hooks/usePermission'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { translateRoleName } from '@/lib/roleLabels'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'
import type { Employee } from '@/api/types/employee.types'
import type { Role, RolePreassignment } from '@/api/types/roles-permissions.types'
import type { User } from '@/api/types/user.types'

interface PreassignRolesModalProps {
  initial: RolePreassignment | null
  roles: Role[]
  onClose: () => void
}

// กำหนด role ล่วงหน้าให้อีเมลบริษัท — ไม่สร้างบัญชี/ไม่ส่งรหัสผ่าน แค่จำไว้ว่าพออีเมลนี้ login ผ่าน Microsoft
// ครั้งแรกจะได้ role อะไร (ดู backend RolePreassignmentsService) แก้ไขคือส่งอีเมลเดิมซ้ำ (upsert)
function PreassignRolesModal({ initial, roles, onClose }: PreassignRolesModalProps) {
  const upsertMutation = useUpsertRolePreassignmentMutation()
  const [email, setEmail] = useState(initial?.email ?? '')
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set(initial?.roleIds ?? []))

  function toggleRole(roleId: number) {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  function handleSubmit() {
    if (!email.trim() || selectedRoleIds.size === 0) {
      toast.error('กรอกอีเมล และเลือกอย่างน้อย 1 role')
      return
    }
    upsertMutation.mutate(
      { email: email.trim(), roleIds: Array.from(selectedRoleIds) },
      {
        onSuccess: () => {
          toast.success('บันทึกสิทธิ์ล่วงหน้าเรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(getErrorMessage(e, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        เมื่ออีเมลนี้ login ผ่าน Microsoft ครั้งแรก จะได้รับ role ที่เลือกไว้อัตโนมัติ — ไม่มีการสร้างบัญชีหรือส่งรหัสผ่าน
      </p>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">อีเมลบริษัท</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="somchai.j@millimedthailand.com"
          disabled={!!initial}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Roles</label>
        <div className="space-y-2">
          {roles.map((role) => {
            const checked = selectedRoleIds.has(role.roleId)
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
                  onChange={() => toggleRole(role.roleId)}
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
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </div>
  )
}

interface AssignEmployeeRolesModalProps {
  employee: Employee
  currentRoleIds: number[]
  roles: Role[]
  onClose: () => void
}

// กำหนดบทบาทผูกกับ employee_id ตรงๆ (ดู RolesPermissionsService.assignRolesToEmployee) ไม่ต้องพึ่ง user account
// เลย — พนักงานที่ยังไม่มีบัญชี login ก็กำหนดสิทธิ์ได้เหมือนกัน (คนที่ยังไม่มีข้อมูลพนักงานเลยใช้ PreassignRolesModal แทน)
function AssignEmployeeRolesModal({ employee, currentRoleIds, roles, onClose }: AssignEmployeeRolesModalProps) {
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
    assignMutation.mutate(
      { employeeId: employee.employeeId, dto: { roleIds: Array.from(selectedIds) } },
      {
        onSuccess: () => {
          toast.success('บันทึกสิทธิ์เรียบร้อยแล้ว')
          onClose()
        },
        onError: (e) => toast.error(getErrorMessage(e, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  const hasChanges = selectedIds.size !== currentRoleIds.length || currentRoleIds.some((id) => !selectedIds.has(id))

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{employee.fullName}</p>
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

export function EmployeesListPage() {
  usePageTitle('ผู้ใช้งาน/พนักงาน')
  const currentUser = useAuthStore((s) => s.user)
  const { hasPermission } = usePermission()
  // บัญชีผู้ใช้งาน (login/roles/สถานะ) รวมมาจากหน้า /users เดิม — ต้องมีสิทธิ์ user.view_all ถึงจะเห็นคอลัมน์พวกนี้
  // (ดู UsersController) ส่วนกำหนดสิทธิ์ต้อง rbac.manage แยกต่างหากเหมือนเดิม ไม่งั้น HR ที่เห็นแค่ employee.view_all
  // จะยิง request ไปชน 403 โดยไม่จำเป็น
  const canViewUsers = hasPermission('user.view_all')
  const canViewEmployees = hasPermission('employee.view_all')
  const canManageRbac = hasPermission('rbac.manage')

  // route เข้าได้ด้วย employee.view_all หรือ user.view_all อย่างใดอย่างหนึ่ง (ดู router.tsx) แต่รายการ
  // พนักงานหลักของหน้านี้ต้องการ employee.view_all เจาะจง — role ที่มีแค่ user.view_all จะเข้าหน้าได้
  // แต่ไม่มีสิทธิ์เห็นรายการนี้ ต้องกันไม่ให้ยิง request ที่รู้อยู่แล้วว่าจะโดน 403 แล้วโชว์เหตุผลตรงๆ แทน
  const { data: employees = [], isLoading, isError, refetch } = useEmployeesQuery({ enabled: canViewEmployees })
  const { data: users = [] } = useUsersQuery({ enabled: canViewUsers })
  const { data: roles = [] } = useRolesQuery({ enabled: canManageRbac })
  const [search, setSearch] = useState('')
  const { data: preassignments = [] } = useRolePreassignmentsQuery({ enabled: canManageRbac })
  const deletePreassignmentMutation = useDeleteRolePreassignmentMutation()
  // undefined = ปิด, null = เพิ่มใหม่, object = แก้ไขรายการเดิม
  const [editingPreassignment, setEditingPreassignment] = useState<RolePreassignment | null | undefined>(undefined)
  const [deletingPreassignment, setDeletingPreassignment] = useState<RolePreassignment | null>(null)
  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.roleId, r.roleName])), [roles])
  const [managingEmployee, setManagingEmployee] = useState<Employee | null>(null)

  const usersByEmployeeId = useMemo(() => {
    const map = new Map<number, User>()
    for (const u of users) if (u.employeeId) map.set(u.employeeId, u)
    return map
  }, [users])

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    const matchingUser = usersByEmployeeId.get(e.employeeId)
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      (matchingUser?.username.toLowerCase().includes(q) ?? false) ||
      (matchingUser?.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const columns: DataTableColumn<Employee>[] = [
    { key: 'code', header: 'รหัสพนักงาน', render: (e) => <span className="font-medium">{e.employeeCode}</span> },
    { key: 'name', header: 'ชื่อ-นามสกุล', render: (e) => e.fullName },
    { key: 'department', header: 'แผนก', render: (e) => e.department?.departmentName ?? '-' },
    { key: 'position', header: 'ตำแหน่ง', render: (e) => e.position ?? '-' },
    { key: 'email', header: 'อีเมล', render: (e) => e.email ?? '-' },
    { key: 'phone', header: 'เบอร์โทร', render: (e) => e.phone ?? '-' },
    ...(canViewUsers
      ? [
          {
            key: 'roles',
            header: 'Roles',
            render: (e: Employee) => {
              const employeeRoles = usersByEmployeeId.get(e.employeeId)?.employee?.employeeRoles ?? []
              if (employeeRoles.length === 0) return <span className="text-xs text-slate-400">ยังไม่ได้กำหนด</span>
              return (
                <div className="flex flex-wrap gap-1.5">
                  {employeeRoles.map((er) => (
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
            render: (e: Employee) => {
              const matchingUser = usersByEmployeeId.get(e.employeeId)
              if (!matchingUser) return <span className="text-xs text-slate-400">ยังไม่มีบัญชีผู้ใช้งาน</span>
              return (
                <span className={matchingUser.isActive ? 'text-emerald-600' : 'text-slate-400'}>
                  {matchingUser.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </span>
              )
            },
          } satisfies DataTableColumn<Employee>,
        ]
      : []),
    ...(canManageRbac
      ? [
          {
            key: 'action',
            header: 'การจัดการ',
            className: 'text-right',
            render: (e: Employee) => {
              const isSelf = currentUser?.employeeId === e.employeeId
              if (isSelf) {
                return (
                  <span className="ml-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Lock size={13} /> บัญชีของคุณ
                  </span>
                )
              }
              return (
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => setManagingEmployee(e)}>
                    <ShieldCheck size={14} /> กำหนดสิทธิ์
                  </Button>
                </div>
              )
            },
          } satisfies DataTableColumn<Employee>,
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหารหัสพนักงาน, ชื่อ, username, อีเมล..."
          className="max-w-xs"
        />
        {canManageRbac && (
          <Button onClick={() => setEditingPreassignment(null)}>
            <UserPlus size={16} /> กำหนดสิทธิ์ล่วงหน้า
          </Button>
        )}
      </div>
      <Card className="p-0">
        <div className="p-4">
          {canViewEmployees ? (
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(e) => e.employeeId}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
            />
          ) : (
            <EmptyState icon={Lock} message="คุณไม่มีสิทธิ์ดูรายชื่อพนักงาน (ต้องมีสิทธิ์ employee.view_all)" />
          )}
        </div>
      </Card>

      {canManageRbac && preassignments.length > 0 && (
        <Card className="p-0">
          <div className="space-y-3 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">กำหนดสิทธิ์ล่วงหน้า (รอเข้าสู่ระบบครั้งแรก)</p>
              <p className="text-xs text-slate-400">รายการจะหายไปเองเมื่ออีเมลนั้น login ผ่าน Microsoft และได้รับ role แล้ว</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {preassignments.map((p) => (
                <div key={p.rolePreassignmentId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.email}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.roleIds.map((roleId) => {
                        const roleName = roleNameById.get(roleId)
                        return (
                          <span
                            key={roleId}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {roleName ? translateRoleName(roleName) : roleId}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString('th-TH')}</span>
                    <Button size="sm" variant="secondary" onClick={() => setEditingPreassignment(p)}>
                      <Pencil size={14} /> แก้ไข
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setDeletingPreassignment(p)}>
                      <Trash2 size={14} /> ลบ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Modal
        open={editingPreassignment !== undefined}
        onClose={() => setEditingPreassignment(undefined)}
        title={editingPreassignment ? 'แก้ไขสิทธิ์ล่วงหน้า' : 'กำหนดสิทธิ์ล่วงหน้า'}
        overlay="dim"
      >
        {editingPreassignment !== undefined && (
          <PreassignRolesModal initial={editingPreassignment} roles={roles} onClose={() => setEditingPreassignment(undefined)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingPreassignment}
        title="ลบสิทธิ์ล่วงหน้า"
        description={`ลบการกำหนดสิทธิ์ล่วงหน้าของ ${deletingPreassignment?.email ?? ''}? เมื่อ login ครั้งแรกจะยังไม่มี role จนกว่าผู้ดูแลจะกำหนดให้`}
        confirmLabel="ลบ"
        isLoading={deletePreassignmentMutation.isPending}
        onCancel={() => setDeletingPreassignment(null)}
        onConfirm={() => {
          if (!deletingPreassignment) return
          deletePreassignmentMutation.mutate(deletingPreassignment.rolePreassignmentId, {
            onSuccess: () => {
              toast.success('ลบเรียบร้อยแล้ว')
              setDeletingPreassignment(null)
            },
            onError: (e) => toast.error(getErrorMessage(e, 'ลบไม่สำเร็จ')),
          })
        }}
      />

      <Modal open={!!managingEmployee} onClose={() => setManagingEmployee(null)} title="กำหนดสิทธิ์" overlay="none">
        {managingEmployee && (
          <AssignEmployeeRolesModal
            employee={managingEmployee}
            currentRoleIds={usersByEmployeeId.get(managingEmployee.employeeId)?.employee?.employeeRoles?.map((er) => er.roleId) ?? []}
            roles={roles}
            onClose={() => setManagingEmployee(null)}
          />
        )}
      </Modal>
    </div>
  )
}
