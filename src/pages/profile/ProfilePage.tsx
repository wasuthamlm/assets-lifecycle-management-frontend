import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useCurrentUser, useUpdateMyEmployeeProfile } from '@/hooks/useAuth'
import { useDepartmentsQuery } from '@/hooks/useMasterData'
import { useLogoutFlow } from '@/hooks/useLogoutFlow'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { applyTheme, useUiStore } from '@/stores/ui.store'
import { translateRoleName } from '@/lib/roleLabels'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CurrentUser } from '@/api/types/auth.types'
import { LineLinkCard } from '@/components/profile/LineLinkCard'

const NEW_DEPARTMENT_OPTION = '__new__'

type Employee = NonNullable<CurrentUser['employee']>

// ฟอร์มแก้ข้อมูลพนักงานของตัวเอง (PATCH /auth/me/employee-profile) — ชื่อ-นามสกุลแก้เองไม่ได้ ต้องให้ HR แก้
// รหัสพนักงานเติมได้เฉพาะตอนยังว่าง (ข้ามไว้ตอนกรอกโปรไฟล์ครั้งแรก) มีแล้วโชว์เป็นข้อความเฉยๆ
function EmployeeProfileForm({ employee }: { employee: Employee }) {
  const { data: departments = [] } = useDepartmentsQuery()
  const updateProfile = useUpdateMyEmployeeProfile()

  const initialDepartmentId = employee.department?.departmentId ? String(employee.department.departmentId) : ''
  const [employeeCode, setEmployeeCode] = useState('')
  const [phone, setPhone] = useState(employee.phone ?? '')
  const [position, setPosition] = useState(employee.position ?? '')
  const [departmentId, setDepartmentId] = useState(initialDepartmentId)
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [confirmingNewDepartment, setConfirmingNewDepartment] = useState(false)

  // บันทึกแล้ว /auth/me โหลดใหม่ — รีเซ็ตฟอร์มตามค่าล่าสุดจาก backend
  useEffect(() => {
    setEmployeeCode('')
    setPhone(employee.phone ?? '')
    setPosition(employee.position ?? '')
    setDepartmentId(employee.department?.departmentId ? String(employee.department.departmentId) : '')
    setNewDepartmentName('')
  }, [employee])

  const isAddingNewDepartment = departmentId === NEW_DEPARTMENT_OPTION
  const dirty =
    employeeCode.trim() !== '' ||
    phone.trim() !== (employee.phone ?? '') ||
    position.trim() !== (employee.position ?? '') ||
    departmentId !== initialDepartmentId

  function handleSubmit() {
    if (isAddingNewDepartment && !newDepartmentName.trim()) {
      toast.error('กรอกชื่อแผนกใหม่')
      return
    }
    // เพิ่มแผนกใหม่คือการบันทึกข้อมูลกลาง (department) ลงฐานข้อมูลจริง ให้ยืนยันก่อนเสมอ (เหมือน CompleteProfilePage)
    if (isAddingNewDepartment) {
      setConfirmingNewDepartment(true)
      return
    }
    submit()
  }

  function submit() {
    updateProfile.mutate(
      {
        employeeCode: employeeCode.trim() || undefined,
        phone: phone.trim(),
        position: position.trim(),
        departmentId: isAddingNewDepartment ? undefined : departmentId ? Number(departmentId) : null,
        newDepartmentName: isAddingNewDepartment ? newDepartmentName.trim() : undefined,
      },
      {
        onSuccess: () => toast.success('บันทึกข้อมูลเรียบร้อยแล้ว'),
        onError: (e) => toast.error(getErrorMessage(e, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">ข้อมูลพนักงาน</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อ-นามสกุล</label>
          <Input value={employee.fullName} disabled />
          <p className="mt-1 text-xs text-slate-400">หากต้องการแก้ไขชื่อ กรุณาติดต่อ HR</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รหัสพนักงาน</label>
          {employee.employeeCode ? (
            <>
              <Input value={employee.employeeCode} disabled />
              <p className="mt-1 text-xs text-slate-400">หากรหัสไม่ถูกต้อง กรุณาติดต่อ HR</p>
            </>
          ) : (
            <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="EMP-0010" />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">แผนก</label>
          <Select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
              if (e.target.value !== NEW_DEPARTMENT_OPTION) setNewDepartmentName('')
            }}
          >
            <option value="">ไม่ระบุ</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
            <option value={NEW_DEPARTMENT_OPTION}>+ ไม่เจอแผนกที่ต้องการ เพิ่มใหม่</option>
          </Select>
          {isAddingNewDepartment && (
            <Input
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="ชื่อแผนกใหม่"
              className="mt-2"
              autoFocus
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ตำแหน่ง</label>
          <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Staff" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เบอร์โทรศัพท์</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081-234-5678" />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={!dirty || updateProfile.isPending}>
          {updateProfile.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>

      <Modal open={confirmingNewDepartment} onClose={() => setConfirmingNewDepartment(false)} title="ยืนยันเพิ่มแผนกใหม่">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ยังไม่มีแผนก <span className="font-semibold text-slate-800 dark:text-slate-100">"{newDepartmentName.trim()}"</span> ในระบบ
            ต้องการเพิ่มแผนกนี้เข้าฐานข้อมูลใช่หรือไม่?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmingNewDepartment(false)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmingNewDepartment(false)
                submit()
              }}
            >
              ยืนยันเพิ่มแผนก
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

// หน้า "บัญชีของฉัน" — ทุก role เข้าได้ (ไม่มี PermissionRoute) ย้ายมาจากแท็บโปรไฟล์ในหน้าตั้งค่า ซึ่งต้องมี master.manage
export function ProfilePage() {
  usePageTitle('บัญชีของฉัน')
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
              {user.employee?.fullName ?? user.fullName ?? user.username}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user.roles.length ? user.roles.map(translateRoleName).join(' · ') : 'ยังไม่มีบทบาท'}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">ชื่อผู้ใช้</dt>
            <dd className="text-slate-700 dark:text-slate-200">{user.username}</dd>
          </div>
          <div>
            <dt className="text-slate-400">อีเมล</dt>
            <dd className="text-slate-700 dark:text-slate-200">{user.email ?? '-'}</dd>
          </div>
        </dl>
      </Card>

      {user.employee && <EmployeeProfileForm employee={user.employee} />}

      {user.employee && <LineLinkCard />}

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">ธีมสี</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">ธีมปัจจุบัน: {theme === 'light' ? 'สว่าง' : 'มืด'}</p>
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
