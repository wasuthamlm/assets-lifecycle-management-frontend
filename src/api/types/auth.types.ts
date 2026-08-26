export interface LoginDto {
  username: string
  password: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  mustChangePassword: boolean
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface ResetPasswordDto {
  token: string
  newPassword: string
}

export interface SsoExchangeDto {
  accessToken: string
}

export interface CurrentUser {
  userId: number
  username: string
  email: string | null
  employeeId: number | null
  mustChangePassword: boolean
  permissions: string[]
  roles: string[]
  employee: {
    employeeId: number
    employeeCode: string
    fullName: string
    position: string | null
    email: string | null
    department: { departmentId: number; departmentName: string } | null
  } | null
}
