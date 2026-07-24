import type { DisposalMethod } from './common.types'

export interface Disposal {
  disposalId: number
  assetId: number
  asset?: { assetId: number; assetNo: string; assetName: string } | null
  disposalMethod: DisposalMethod
  disposalDate: string
  saleAmount: number | null
  approvedBy: number | null
  approvedByEmployee?: { employeeId: number; fullName: string } | null
  reason: string | null
  createdAt: string
}

export interface CreateDisposalDto {
  assetId: number
  disposalMethod: DisposalMethod
  disposalDate: string
  saleAmount?: number
  approvedBy: number
  reason?: string
}
