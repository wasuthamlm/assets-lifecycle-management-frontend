export interface AssetCategory {
  categoryId: number
  categoryName: string
  assetType: string | null
  parentCategoryId: number | null
}

export interface CreateAssetCategoryDto {
  categoryName: string
  assetType?: string
  parentCategoryId?: number
}

export type UpdateAssetCategoryDto = Partial<CreateAssetCategoryDto>

export interface Vendor {
  vendorId: number
  vendorName: string
  vendorType: string | null
  contactInfo: string | null
}

export interface Location {
  locationId: number
  locationName: string
  locationType: string | null
  site: string | null
  companyId: number | null
}

export interface Company {
  companyId: number
  companyName: string
}

export interface AllowedDomain {
  allowedDomainId: number
  domain: string
  companyId: number | null
  company?: Company | null
  isEnabled: boolean
  createdAt: string
}

export interface CreateAllowedDomainDto {
  domain: string
  companyId?: number
  isEnabled?: boolean
}

export type UpdateAllowedDomainDto = Partial<CreateAllowedDomainDto>
