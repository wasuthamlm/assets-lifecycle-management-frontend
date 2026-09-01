import type { AssetStatus, AssignmentType, HolderType, ReturnCondition } from './common.types'

export interface Assignment {
  assignmentId: number
  assetId: number
  asset?: {
    assetId: number
    assetNo: string
    assetName: string
    currentStatus?: AssetStatus | null
    warrantyExpireDate?: string | null
    category?: { categoryId: number; categoryName: string } | null
    currentLocation?: { locationId: number; locationName: string } | null
  } | null
  requisitionId: number | null
  assignmentType: AssignmentType
  holderType: HolderType
  holderId: number
  issuedDate: string
  issuedBy: number
  issuedByEmployee?: { employeeId: number; fullName: string } | null
  dueDate: string | null
  returnedDate: string | null
  receivedBy: number | null
  returnCondition: ReturnCondition | null
  notes: string | null
  createdAt: string
  // holderId เป็น polymorphic FK — ต้องเลือก field ชื่อที่ตรงกับ holderType เอาเอง (ดู resolveHolderName)
  holder?: {
    fullName?: string
    departmentName?: string
    locationName?: string
    vendorName?: string
    department?: { departmentName: string } | null
    phone?: string | null
  } | null
}

export interface IssueAssetDto {
  assetId: number
  requisitionId?: number
  assignmentType: AssignmentType
  holderType: HolderType
  holderId: number
  dueDate?: string
  notes?: string
}

export interface ReturnAssetDto {
  returnCondition: ReturnCondition
  notes?: string
}
