import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { CreateWarrantyDto, RenewWarrantyDto, Warranty } from '../types/warranty.types'

export const warrantyService = {
  async byAsset(assetId: number): Promise<Warranty[]> {
    const { data } = await apiClient.get<Warranty[]>(ENDPOINTS.warranty.byAsset(assetId))
    return data
  },
  async get(id: number): Promise<Warranty> {
    const { data } = await apiClient.get<Warranty>(ENDPOINTS.warranty.byId(id))
    return data
  },
  async create(dto: CreateWarrantyDto): Promise<Warranty> {
    const { data } = await apiClient.post<Warranty>(ENDPOINTS.warranty.base, dto)
    return data
  },
  async renew(id: number, dto: RenewWarrantyDto): Promise<Warranty> {
    const { data } = await apiClient.post<Warranty>(ENDPOINTS.warranty.renew(id), dto)
    return data
  },
}
