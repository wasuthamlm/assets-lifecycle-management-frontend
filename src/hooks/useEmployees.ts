import { useQuery } from '@tanstack/react-query'
import { employeesService } from '@/api/services/employees.service'

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
