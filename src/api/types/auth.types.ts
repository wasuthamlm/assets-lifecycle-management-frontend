export interface LoginDto {
  username: string
  password: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface CurrentUser {
  userId: number
  username: string
  email: string | null
  employeeId: number | null
  permissions: string[]
  employee: {
    employeeId: number
    employeeCode: string
    fullName: string
    position: string | null
    email: string | null
    department: { departmentId: number; departmentName: string } | null
  } | null
}
