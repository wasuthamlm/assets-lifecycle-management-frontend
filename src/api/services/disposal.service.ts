import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Paginated } from '../types/common.types'
import type { CreateDisposalDto, Disposal, QueryDisposalDto } from '../types/disposal.types'

export const disposalService = {
  async list(query: QueryDisposalDto = {}): Promise<Paginated<Disposal>> {
    const { data } = await apiClient.get<Paginated<Disposal>>(ENDPOINTS.disposal.base, { params: query })
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
