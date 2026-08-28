import type { HolderType, MovementType } from './common.types'

export interface Movement {
  movementId: number
  assetId: number
  asset?: { assetId: number; assetNo: string; assetName: string } | null
  movementType: MovementType
  fromLocationId: number | null
  fromLocation?: { locationId: number; locationName: string } | null
  toLocationId: number | null
  toLocation?: { locationId: number; locationName: string } | null
  fromHolderType: HolderType | null
  fromHolderId: number | null
  toHolderType: HolderType | null
  toHolderId: number | null
  /** resolve แล้วเฉพาะตอน toHolderType เป็น employee (ใครเบิก/ยืมของไป) — ดู MovementsService.attachToHolderEmployee */
  toHolderEmployee?: {
    employeeId: number
    employeeCode: string
    fullName: string
    department?: { departmentId: number; departmentName: string } | null
  } | null
  referenceType: string | null
  referenceId: number | null
  performedBy: number
  performedByEmployee?: { employeeId: number; fullName: string } | null
  notes: string | null
  createdAt: string
}
