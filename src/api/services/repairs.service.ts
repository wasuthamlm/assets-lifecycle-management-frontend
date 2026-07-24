import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { CreateRepairDto, Repair, UpdateRepairStatusDto } from '../types/repair.types'

export const repairsService = {
  async list(): Promise<Repair[]> {
    const { data } = await apiClient.get<Repair[]>(ENDPOINTS.repairs.base)
    return data
  },
  async get(id: number): Promise<Repair> {
    const { data } = await apiClient.get<Repair>(ENDPOINTS.repairs.byId(id))
    return data
  },
  async create(dto: CreateRepairDto): Promise<Repair> {
    const { data } = await apiClient.post<Repair>(ENDPOINTS.repairs.base, dto)
    return data
  },
  async updateStatus(id: number, dto: UpdateRepairStatusDto): Promise<Repair> {
    const { data } = await apiClient.patch<Repair>(ENDPOINTS.repairs.status(id), dto)
    return data
  },
}
