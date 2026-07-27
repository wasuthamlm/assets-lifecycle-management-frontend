import type { RepairResult, RepairStatus } from './common.types'

export interface Repair {
  repairId: number
  assetId: number
  asset?: { assetId: number; assetNo: string; assetName: string } | null
  reportedBy: number
  problemDescription: string | null
  status: RepairStatus
  vendorId: number | null
  vendor?: { vendorId: number; vendorName: string } | null
  sentToVendorDate: string | null
  repairedDate: string | null
  result: RepairResult | null
  repairCost: number | null
  notes: string | null
  createdAt: string
}

export interface CreateRepairDto {
  assetId: number
  problemDescription?: string
  vendorId?: number
}

export interface UpdateRepairStatusDto {
  status: RepairStatus
  result?: RepairResult
  repairCost?: number
  notes?: string
}
