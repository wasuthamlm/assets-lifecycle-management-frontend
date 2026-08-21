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
