import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type {
  AllowedDomain,
  AssetCategory,
  Company,
  CreateAllowedDomainDto,
  CreateAssetCategoryDto,
  Location,
  UpdateAllowedDomainDto,
  UpdateAssetCategoryDto,
  Vendor,
} from '../types/master-data.types'
import type { Department } from '../types/employee.types'

export const masterDataService = {
  async assetCategories(): Promise<AssetCategory[]> {
    const { data } = await apiClient.get<AssetCategory[]>(ENDPOINTS.assetCategories.base)
    return data
  },
  async createAssetCategory(dto: CreateAssetCategoryDto): Promise<AssetCategory> {
    const { data } = await apiClient.post<AssetCategory>(ENDPOINTS.assetCategories.base, dto)
    return data
  },
  async updateAssetCategory(id: number, dto: UpdateAssetCategoryDto): Promise<AssetCategory> {
    const { data } = await apiClient.patch<AssetCategory>(ENDPOINTS.assetCategories.byId(id), dto)
    return data
  },
  async deleteAssetCategory(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.assetCategories.byId(id))
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
  async allowedDomains(): Promise<AllowedDomain[]> {
    const { data } = await apiClient.get<AllowedDomain[]>(ENDPOINTS.allowedDomains.base)
    return data
  },
  async createAllowedDomain(dto: CreateAllowedDomainDto): Promise<AllowedDomain> {
    const { data } = await apiClient.post<AllowedDomain>(ENDPOINTS.allowedDomains.base, dto)
    return data
  },
  async updateAllowedDomain(id: number, dto: UpdateAllowedDomainDto): Promise<AllowedDomain> {
    const { data } = await apiClient.patch<AllowedDomain>(ENDPOINTS.allowedDomains.byId(id), dto)
    return data
  },
  async deleteAllowedDomain(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.allowedDomains.byId(id))
  },
}
