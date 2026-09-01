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

export interface CompleteEmployeeProfileDto {
  employeeCode: string
  fullName: string
  phone?: string
  departmentId?: number
  newDepartmentName?: string
  position?: string
}

export interface CurrentUser {
  userId: number
  username: string
  email: string | null
  /** ชื่อจาก employee record ถ้ามี ไม่งั้น fallback ไปชื่อจาก Azure AD ที่ sync ไว้ตอน login SSO (อาจเป็น null ทั้งคู่) */
  fullName: string | null
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
    phone: string | null
    department: { departmentId: number; departmentName: string } | null
  } | null
}
