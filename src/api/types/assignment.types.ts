import type { AssignmentType, HolderType, ReturnCondition } from './common.types'

export interface Assignment {
  assignmentId: number
  assetId: number
  requisitionId: number | null
  assignmentType: AssignmentType
  holderType: HolderType
  holderId: number
  issuedDate: string
  issuedBy: number
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
  issuedBy: number
  dueDate?: string
  notes?: string
}

export interface ReturnAssetDto {
  receivedBy: number
  returnCondition: ReturnCondition
  notes?: string
}
