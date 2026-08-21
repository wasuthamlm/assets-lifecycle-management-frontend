import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesPermissionsService } from '@/api/services/roles-permissions.service'
import type { AssignPermissionsDto, CreateRoleDto } from '@/api/types/roles-permissions.types'

export function useRolesQuery() {
  return useQuery({ queryKey: ['roles'], queryFn: () => rolesPermissionsService.roles() })
}

export function usePermissionsQuery() {
  return useQuery({ queryKey: ['permissions'], queryFn: () => rolesPermissionsService.permissions() })
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRoleDto) => rolesPermissionsService.createRole(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useAssignPermissionsToRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, dto }: { roleId: number; dto: AssignPermissionsDto }) =>
      rolesPermissionsService.assignPermissionsToRole(roleId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}
