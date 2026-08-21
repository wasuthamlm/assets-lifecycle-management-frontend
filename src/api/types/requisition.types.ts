import type { ApprovalStatus, RequestType } from './common.types'

export interface RequisitionItem {
  requisitionItemId: number
  requisitionId: number
  assetId: number | null
  asset?: { assetId: number; assetNo: string; assetName: string } | null
  stockItemId: number | null
  quantity: number | null
}

export interface RequisitionApproval {
  approvalId: number
  requisitionId: number
  approvalLevel: number
  approverId: number
  approver?: { employeeId: number; fullName: string } | null
  status: ApprovalStatus
  actionedAt: string | null
  comment: string | null
}

export interface Requisition {
  requisitionId: number
  requisitionNo: string
  requestedBy: number
  requestedByEmployee?: { employeeId: number; fullName: string } | null
  requestType: RequestType
  overallStatus: ApprovalStatus
  dueDate: string | null
  reason: string | null
  items: RequisitionItem[]
  approvals: RequisitionApproval[]
  createdAt: string
  updatedAt: string | null
}

export interface RequisitionItemInput {
  assetId?: number
  stockItemId?: number
  quantity?: number
}

export interface CreateRequisitionDto {
  requestType: RequestType
  dueDate?: string
  reason?: string
  items: RequisitionItemInput[]
  approverIds: number[]
}

export interface ApproveRequisitionDto {
  status: ApprovalStatus
  comment?: string
}

export interface QueryRequisitionDto {
  search?: string
  status?: ApprovalStatus
  requestType?: RequestType
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}
