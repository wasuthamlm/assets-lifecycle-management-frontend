import type { AssignmentType, HolderType, ReturnCondition } from './common.types'

export interface Assignment {
  assignmentId: number
  assetId: number
  asset?: { assetId: number; assetNo: string; assetName: string } | null
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
