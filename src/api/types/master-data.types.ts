export interface AssetCategory {
  categoryId: number
  categoryName: string
  assetType: string | null
  parentCategoryId: number | null
}

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
