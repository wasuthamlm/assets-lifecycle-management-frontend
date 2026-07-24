import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { CreateDisposalDto, Disposal } from '../types/disposal.types'

export const disposalService = {
  async list(): Promise<Disposal[]> {
    const { data } = await apiClient.get<Disposal[]>(ENDPOINTS.disposal.base)
    return data
  },
  async get(id: number): Promise<Disposal> {
    const { data } = await apiClient.get<Disposal>(ENDPOINTS.disposal.byId(id))
    return data
  },
  async create(dto: CreateDisposalDto): Promise<Disposal> {
    const { data } = await apiClient.post<Disposal>(ENDPOINTS.disposal.base, dto)
    return data
  },
}
