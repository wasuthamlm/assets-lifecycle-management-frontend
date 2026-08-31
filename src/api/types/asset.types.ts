import type { AssetStatus, HolderType } from './common.types'

export interface Asset {
  assetId: number
  assetNo: string
  categoryId: number | null
  category?: {
    categoryId: number
    categoryName: string
    parent?: { categoryId: number; categoryName: string } | null
  } | null
  assetName: string
  serialNumber: string | null
  brand: string | null
  model: string | null
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
  availableCount?: number
  // มีเฉพาะตอนเรียก GET /assets/:id (ดู AssetsService.findOneWithHolder) — เป็น entity แบบ polymorphic
  // ตาม currentHolderType เลือก field ชื่อที่ตรงกันเอาเอง (ดู resolveHolderName ใน AssetDetailPage)
  holder?: {
    fullName?: string
    departmentName?: string
    locationName?: string
    vendorName?: string
  } | null
}

export interface CreateAssetDto {
  categoryId: number
  assetName: string
  serialNumber: string
  brand: string
  model: string
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
  /** หมวดหมู่หลัก — match ทั้งตัวหมวดหมู่หลักเองและหมวดหมู่ย่อยทุกอันข้างใต้ ใช้แทน categoryId ตอนยังไม่เจาะจงหมวดหมู่ย่อย */
  mainCategoryId?: number
  brand?: string
  status?: AssetStatus
  holderType?: HolderType
  page?: number
  limit?: number
}
