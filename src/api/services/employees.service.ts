import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Employee, EmployeeDirectoryEntry, PreRegisterEmployeeDto, PreRegisterEmployeeResult } from '../types/employee.types'
import type { AssignRolesDto } from '../types/roles-permissions.types'

export const employeesService = {
  async list(): Promise<Employee[]> {
    const { data } = await apiClient.get<Employee[]>(ENDPOINTS.employees.base)
    return data
  },

  async directory(): Promise<EmployeeDirectoryEntry[]> {
    const { data } = await apiClient.get<EmployeeDirectoryEntry[]>(ENDPOINTS.employees.directory)
    return data
  },

  async assignRoles(employeeId: number, dto: AssignRolesDto): Promise<void> {
    await apiClient.put(ENDPOINTS.employees.roles(employeeId), dto)
  },

  async preRegister(dto: PreRegisterEmployeeDto): Promise<PreRegisterEmployeeResult> {
    const { data } = await apiClient.post<PreRegisterEmployeeResult>(ENDPOINTS.employees.preRegister, dto)
    return data
  },
}
