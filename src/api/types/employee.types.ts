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

export interface CreateEmployeeDto {
  employeeCode: string
  fullName: string
  departmentId?: number
  position?: string
  email?: string
  phone?: string
}
