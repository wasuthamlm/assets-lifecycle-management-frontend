import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { AssetCategory, Company, Location, Vendor } from '../types/master-data.types'
import type { Department } from '../types/employee.types'

export const masterDataService = {
  async assetCategories(): Promise<AssetCategory[]> {
    const { data } = await apiClient.get<AssetCategory[]>(ENDPOINTS.assetCategories.base)
    return data
  },
  async vendors(): Promise<Vendor[]> {
    const { data } = await apiClient.get<Vendor[]>(ENDPOINTS.vendors.base)
    return data
  },
  async locations(): Promise<Location[]> {
    const { data } = await apiClient.get<Location[]>(ENDPOINTS.locations.base)
    return data
  },
  async companies(): Promise<Company[]> {
    const { data } = await apiClient.get<Company[]>(ENDPOINTS.companies.base)
    return data
  },
  async departments(): Promise<Department[]> {
    const { data } = await apiClient.get<Department[]>(ENDPOINTS.departments.base)
    return data
  },
}
