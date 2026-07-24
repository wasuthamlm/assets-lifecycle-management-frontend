export interface Department {
  departmentId: number
  departmentName: string
  site: string | null
  companyId: number | null
  parentDepartmentId: number | null
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
}
