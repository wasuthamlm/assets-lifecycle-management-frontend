import type { AssetStatus, HolderType } from './common.types'

export interface Asset {
  assetId: number
  assetNo: string
  categoryId: number | null
  category?: { categoryId: number; categoryName: string } | null
  assetName: string
  serialNumber: string | null
  brandModel: string | null
  vendorId: number | null
  vendor?: { vendorId: number; vendorName: string } | null
  purchaseDate: string | null
  purchaseCost: number | null
  warrantyExpireDate: string | null
  currentStatus: AssetStatus | null
  currentLocationId: number | null
  currentLocation?: { locationId: number; locationName: string } | null
  currentHolderType: HolderType | null
  currentHolderId: number | null
  attributes: Record<string, unknown> | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateAssetDto {
  assetNo: string
  categoryId: number
  assetName: string
  serialNumber?: string
  brandModel?: string
  vendorId?: number
  purchaseDate?: string
  purchaseCost?: number
  warrantyExpireDate?: string
  currentStatus?: AssetStatus
  currentLocationId?: number
  currentHolderType?: HolderType
  currentHolderId?: number
  attributes?: Record<string, unknown>
  notes?: string
}

export type UpdateAssetDto = Partial<CreateAssetDto>

export interface QueryAssetDto {
  search?: string
  categoryId?: number
  status?: AssetStatus
  holderType?: HolderType
  page?: number
  limit?: number
}
