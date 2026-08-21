import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { AssignPermissionsDto, CreateRoleDto, Permission, Role } from '../types/roles-permissions.types'

export const rolesPermissionsService = {
  async roles(): Promise<Role[]> {
    const { data } = await apiClient.get<Role[]>(ENDPOINTS.rolesPermissions.roles)
    return data
  },
  async permissions(): Promise<Permission[]> {
    const { data } = await apiClient.get<Permission[]>(ENDPOINTS.rolesPermissions.permissions)
    return data
  },
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const { data } = await apiClient.post<Role>(ENDPOINTS.rolesPermissions.roles, dto)
    return data
  },
  async assignPermissionsToRole(roleId: number, dto: AssignPermissionsDto): Promise<Role> {
    const { data } = await apiClient.put<Role>(ENDPOINTS.rolesPermissions.rolePermissions(roleId), dto)
    return data
  },
}
