import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Permission, Role } from '../types/roles-permissions.types'

export const rolesPermissionsService = {
  async roles(): Promise<Role[]> {
    const { data } = await apiClient.get<Role[]>(ENDPOINTS.rolesPermissions.roles)
    return data
  },
  async permissions(): Promise<Permission[]> {
    const { data } = await apiClient.get<Permission[]>(ENDPOINTS.rolesPermissions.permissions)
    return data
  },
}
