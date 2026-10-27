export interface Permission {
  permissionId: number
  permissionCode: string
  description: string | null
}

export interface RolePermission {
  roleId: number
  permissionId: number
  permission?: Permission | null
}

export interface Role {
  roleId: number
  roleName: string
  description: string | null
  rolePermissions?: RolePermission[]
}

export interface CreateRoleDto {
  roleName: string
  description?: string
}

export interface AssignPermissionsDto {
  permissionIds: number[]
}

export interface AssignRolesDto {
  roleIds: number[]
}

/** role ที่กำหนดไว้ล่วงหน้าให้อีเมลบริษัท — ได้อัตโนมัติเมื่ออีเมลนี้ login ผ่าน Microsoft ครั้งแรก (ไม่มีการสร้างบัญชี) */
export interface RolePreassignment {
  rolePreassignmentId: number
  email: string
  roleIds: number[]
  createdAt: string
}

export interface UpsertRolePreassignmentDto {
  email: string
  roleIds: number[]
}
