import type { EmployeeRole } from './employee.types'

export interface User {
  userId: number
  username: string
  email: string | null
  /** ชื่อจาก Azure AD ที่ sync ไว้ตอน login SSO — มีค่าเฉพาะบัญชีที่ยังไม่ผูก employee (ดู employee.fullName ถ้ามี) */
  fullName: string | null
  isActive: boolean
  employeeId: number | null
  employee?: { employeeId: number; fullName: string; employeeRoles?: EmployeeRole[] } | null
}

export interface UpdateUserDto {
  employeeId?: number
  isActive?: boolean
}
