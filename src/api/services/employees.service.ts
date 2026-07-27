import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Employee, EmployeeDirectoryEntry } from '../types/employee.types'

export const employeesService = {
  async list(): Promise<Employee[]> {
    const { data } = await apiClient.get<Employee[]>(ENDPOINTS.employees.base)
    return data
  },

  async directory(): Promise<EmployeeDirectoryEntry[]> {
    const { data } = await apiClient.get<EmployeeDirectoryEntry[]>(ENDPOINTS.employees.directory)
    return data
  },
}
