import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, UserPlus } from 'lucide-react'
import { useEmployeesQuery, usePreRegisterEmployeeMutation } from '@/hooks/useEmployees'
import { useRolesQuery } from '@/hooks/useRolesPermissions'
import { useDepartmentsQuery } from '@/hooks/useMasterData'
import { usePermission } from '@/hooks/usePermission'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { translateRoleName } from '@/lib/roleLabels'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'
import type { Employee, PreRegisterEmployeeResult } from '@/api/types/employee.types'

function PreRegisterEmployeeModal({ onClose }: { onClose: () => void }) {
  const { data: roles = [] } = useRolesQuery()
  const { data: departments = [] } = useDepartmentsQuery()
  const preRegisterMutation = usePreRegisterEmployeeMutation()

  const [employeeCode, setEmployeeCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [position, setPosition] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<PreRegisterEmployeeResult | null>(null)

  function toggleRole(roleId: number) {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  function handleSubmit() {
    if (!employeeCode.trim() || !fullName.trim() || !email.trim() || selectedRoleIds.size === 0) {
      toast.error('กรอกรหัสพนักงาน ชื่อ-นามสกุล อีเมล และเลือกอย่างน้อย 1 role')
      return
    }
    preRegisterMutation.mutate(
      {
        employeeCode: employeeCode.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        departmentId: departmentId ? Number(departmentId) : undefined,
        position: position.trim() || undefined,
        roleIds: Array.from(selectedRoleIds),
      },
      {
        onSuccess: (data) => {
          toast.success('ลงทะเบียนพนักงานเรียบร้อยแล้ว')
          setResult(data)
        },
        onError: (e) => toast.error(getErrorMessage(e, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  function copyCredentials() {
    if (!result) return
    navigator.clipboard.writeText(`Username: ${result.user.username}\nรหัสผ่านชั่วคราว: ${result.tempPassword}`)
    toast.success('คัดลอกแล้ว')
  }

  if (result) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          สร้างบัญชีให้ <span className="font-medium text-slate-700 dark:text-slate-200">{result.employee.fullName}</span> เรียบร้อยแล้ว
          และส่งข้อมูลนี้ไปที่ {result.user.email} ให้แล้ว (ถ้าระบบตั้งค่า SMTP ไว้)
        </p>
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Username</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-100">{result.user.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">รหัสผ่านชั่วคราว</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-100">{result.tempPassword}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">ผู้ใช้จะถูกบังคับให้เปลี่ยนรหัสผ่านทันทีตอน login ครั้งแรก — โปรดคัดลอกไว้เผื่ออีเมลส่งไม่ถึง</p>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={copyCredentials}>
            <Copy size={14} /> คัดลอก
          </Button>
          <Button type="button" onClick={onClose}>
            เสร็จสิ้น
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">รหัสพนักงาน</label>
        <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="EMP-0010" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">ชื่อ-นามสกุล</label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="สมชาย ใจดี" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">อีเมล (ใช้เป็น username สำหรับ login ด้วย)</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="somchai.j@millimedthailand.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">แผนก (ไม่บังคับ)</label>
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">ตำแหน่ง (ไม่บังคับ)</label>
          <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Staff" />
        </div>
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
        <Button type="button" onClick={handleSubmit} disabled={preRegisterMutation.isPending}>
          {preRegisterMutation.isPending ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
        </Button>
      </div>
    </div>
  )
}

export function EmployeesListPage() {
  usePageTitle('ผู้ใช้งาน/พนักงาน')
  const { data: employees = [], isLoading, isError, refetch } = useEmployeesQuery()
  const { hasPermission } = usePermission()
  const canPreRegister = hasPermission('employee.create') && hasPermission('user.create') && hasPermission('rbac.manage')
  const [search, setSearch] = useState('')
  const [showPreRegister, setShowPreRegister] = useState(false)

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: DataTableColumn<Employee>[] = [
    { key: 'code', header: 'รหัสพนักงาน', render: (e) => <span className="font-medium">{e.employeeCode}</span> },
    { key: 'name', header: 'ชื่อ-นามสกุล', render: (e) => e.fullName },
    { key: 'department', header: 'แผนก', render: (e) => e.department?.departmentName ?? '-' },
    { key: 'position', header: 'ตำแหน่ง', render: (e) => e.position ?? '-' },
    { key: 'email', header: 'อีเมล', render: (e) => e.email ?? '-' },
    { key: 'phone', header: 'เบอร์โทร', render: (e) => e.phone ?? '-' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหารหัสพนักงานหรือชื่อ..."
          className="max-w-xs"
        />
        {canPreRegister && (
          <Button onClick={() => setShowPreRegister(true)}>
            <UserPlus size={16} /> เพิ่มพนักงานล่วงหน้า
          </Button>
        )}
      </div>
      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(e) => e.employeeId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>
      </Card>

      <Modal open={showPreRegister} onClose={() => setShowPreRegister(false)} title="เพิ่มพนักงานล่วงหน้า" overlay="dim">
        {showPreRegister && <PreRegisterEmployeeModal onClose={() => setShowPreRegister(false)} />}
      </Modal>
    </div>
  )
}
