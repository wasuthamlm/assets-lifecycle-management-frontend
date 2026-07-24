import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Movement } from '../types/movement.types'

export const movementsService = {
  async list(): Promise<Movement[]> {
    const { data } = await apiClient.get<Movement[]>(ENDPOINTS.movements.base)
    return data
  },
  async byAsset(assetId: number): Promise<Movement[]> {
    const { data } = await apiClient.get<Movement[]>(ENDPOINTS.movements.byAsset(assetId))
    return data
  },
}
