import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesPermissionsService } from '@/api/services/roles-permissions.service'
import type { AssignPermissionsDto, CreateRoleDto, UpsertRolePreassignmentDto } from '@/api/types/roles-permissions.types'

export function useRolesQuery(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: ['roles'], queryFn: () => rolesPermissionsService.roles(), enabled: options?.enabled })
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

export function useRolePreassignmentsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['role-preassignments'],
    queryFn: () => rolesPermissionsService.preassignments(),
    enabled: options?.enabled,
  })
}

export function useUpsertRolePreassignmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpsertRolePreassignmentDto) => rolesPermissionsService.upsertPreassignment(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-preassignments'] }),
  })
}

export function useDeleteRolePreassignmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => rolesPermissionsService.deletePreassignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-preassignments'] }),
  })
}
