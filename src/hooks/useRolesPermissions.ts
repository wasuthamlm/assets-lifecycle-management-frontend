import { useQuery } from '@tanstack/react-query'
import { rolesPermissionsService } from '@/api/services/roles-permissions.service'

export function useRolesQuery() {
  return useQuery({ queryKey: ['roles'], queryFn: () => rolesPermissionsService.roles() })
}

export function usePermissionsQuery() {
  return useQuery({ queryKey: ['permissions'], queryFn: () => rolesPermissionsService.permissions() })
}
