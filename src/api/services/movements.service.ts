import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Paginated } from '../types/common.types'
import type { Movement, QueryMovementDto } from '../types/movement.types'

export const movementsService = {
  async list(query: QueryMovementDto = {}): Promise<Paginated<Movement>> {
    const { data } = await apiClient.get<Paginated<Movement>>(ENDPOINTS.movements.base, { params: query })
    return data
  },
  async byAsset(assetId: number): Promise<Movement[]> {
    const { data } = await apiClient.get<Movement[]>(ENDPOINTS.movements.byAsset(assetId))
    return data
  },
}
