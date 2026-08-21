import type { Role } from './roles-permissions.types'

export interface Department {
  departmentId: number
  departmentName: string
  site: string | null
  companyId: number | null
  parentDepartmentId: number | null
}

export interface EmployeeRole {
  roleId: number
  employeeId: number
  role?: Role | null
}

export interface Employee {
  employeeId: number
  employeeCode: string
  fullName: string
  departmentId: number | null
  department?: Department | null
  position: string | null
  email: string | null
  phone: string | null
  employeeRoles?: EmployeeRole[]
}

export interface EmployeeDirectoryEntry {
  employeeId: number
  fullName: string
  departmentId: number | null
  position: string | null
}

export interface PreRegisterEmployeeDto {
  employeeCode: string
  fullName: string
  email: string
  departmentId?: number
  position?: string
  roleIds: number[]
}

export interface PreRegisterEmployeeResult {
  employee: Employee
  user: { userId: number; username: string; email: string | null }
  tempPassword: string
}
