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
