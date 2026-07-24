import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Employee } from '../types/employee.types'

export const employeesService = {
  async list(): Promise<Employee[]> {
    const { data } = await apiClient.get<Employee[]>(ENDPOINTS.employees.base)
    return data
  },
}
