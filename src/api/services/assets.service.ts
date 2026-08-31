import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Asset, CreateAssetDto, QueryAssetDto, UpdateAssetDto } from '../types/asset.types'
import type { Paginated } from '../types/common.types'

export const assetsService = {
  async list(query: QueryAssetDto = {}): Promise<Paginated<Asset>> {
    const { data } = await apiClient.get<Paginated<Asset>>(ENDPOINTS.assets.base, { params: query })
    return data
  },
  async brands(): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(ENDPOINTS.assets.brands)
    return data
  },
  async get(id: number): Promise<Asset> {
    const { data } = await apiClient.get<Asset>(ENDPOINTS.assets.byId(id))
    return data
  },
  async create(dto: CreateAssetDto): Promise<Asset> {
    const { data } = await apiClient.post<Asset>(ENDPOINTS.assets.base, dto)
    return data
  },
  async update(id: number, dto: UpdateAssetDto): Promise<Asset> {
    const { data } = await apiClient.patch<Asset>(ENDPOINTS.assets.byId(id), dto)
    return data
  },
  async remove(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.assets.byId(id))
  },
}
