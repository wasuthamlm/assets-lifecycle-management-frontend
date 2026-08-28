import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeesService } from '@/api/services/employees.service'
import type { AssignRolesDto } from '@/api/types/roles-permissions.types'
import type { CreateEmployeeDto, PreRegisterEmployeeDto } from '@/api/types/employee.types'

export function useEmployeesQuery() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesService.list(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useEmployeeDirectoryQuery() {
  return useQuery({
    queryKey: ['employees', 'directory'],
    queryFn: () => employeesService.directory(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAssignEmployeeRolesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, dto }: { employeeId: number; dto: AssignRolesDto }) =>
      employeesService.assignRoles(employeeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateEmployeeDto) => employeesService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function usePreRegisterEmployeeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: PreRegisterEmployeeDto) => employeesService.preRegister(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
