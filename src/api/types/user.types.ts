export interface User {
  userId: number
  username: string
  email: string | null
  isActive: boolean
  employeeId: number | null
  employee?: { employeeId: number; fullName: string } | null
}
