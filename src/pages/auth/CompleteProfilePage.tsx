import { useState } from 'react'
import { toast } from 'sonner'
import { UserCircle } from 'lucide-react'
import { useCompleteEmployeeProfile } from '@/hooks/useAuth'
import { useDepartmentsQuery } from '@/hooks/useMasterData'
import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/errorMessage'

const NEW_DEPARTMENT_OPTION = '__new__'

export function CompleteProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { data: departments = [] } = useDepartmentsQuery()
  const completeProfile = useCompleteEmployeeProfile()

  const [employeeCode, setEmployeeCode] = useState('')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [position, setPosition] = useState('')
  const [confirmingNewDepartment, setConfirmingNewDepartment] = useState(false)

  const isAddingNewDepartment = departmentId === NEW_DEPARTMENT_OPTION

  function validate() {
    if (!employeeCode.trim() || !fullName.trim()) {
      toast.error('กรอกรหัสพนักงานและชื่อ-นามสกุล')
      return false
    }
    if (isAddingNewDepartment && !newDepartmentName.trim()) {
      toast.error('กรอกชื่อแผนกใหม่')
      return false
    }
    return true
  }

  function handleSubmit() {
    if (!validate()) return
    // เพิ่มแผนกใหม่คือการบันทึกข้อมูลกลาง (department) ลงฐานข้อมูลจริง ให้ยืนยันก่อนเสมอ
    if (isAddingNewDepartment) {
      setConfirmingNewDepartment(true)
      return
    }
    submit()
  }

  function submit() {
    completeProfile.mutate(
      {
        employeeCode: employeeCode.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        departmentId: !isAddingNewDepartment && departmentId ? Number(departmentId) : undefined,
        newDepartmentName: isAddingNewDepartment ? newDepartmentName.trim() : undefined,
        position: position.trim() || undefined,
      },
      {
        onSuccess: () => toast.success('บันทึกข้อมูลพนักงานเรียบร้อยแล้ว'),
        onError: (e) => toast.error(getErrorMessage(e, 'บันทึกไม่สำเร็จ')),
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <UserCircle size={22} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">กรอกข้อมูลพนักงาน</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              บัญชี {user?.email ?? user?.username} ยังไม่มีข้อมูลพนักงานในระบบ กรุณากรอกก่อนใช้งานต่อ
            </p>
          </div>
        </div>
        <Card>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">รหัสพนักงาน</label>
              <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="EMP-0010" autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ชื่อ-นามสกุล</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="สมชาย ใจดี" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081-234-5678" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">แผนก (ไม่บังคับ)</label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">ตำแหน่ง (ไม่บังคับ)</label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Staff" />
            </div>
            <Button type="button" className="w-full" onClick={handleSubmit} disabled={completeProfile.isPending}>
              {completeProfile.isPending ? 'กำลังบันทึก...' : 'บันทึกและเข้าใช้งาน'}
            </Button>
          </div>
        </Card>
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
    </div>
  )
}
