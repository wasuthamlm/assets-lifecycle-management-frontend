import type { WarrantyStatus } from './common.types'

export interface Warranty {
  warrantyId: number
  assetId: number
  asset?: { assetId: number; assetNo: string; assetName: string } | null
  vendorId: number | null
  vendor?: { vendorId: number; vendorName: string } | null
  startDate: string
  endDate: string
  status: WarrantyStatus
  coverageDetail: string | null
}

export interface CreateWarrantyDto {
  assetId: number
  vendorId?: number
  startDate: string
  endDate: string
  coverageDetail?: string
}

export interface RenewWarrantyDto {
  newEndDate: string
}
