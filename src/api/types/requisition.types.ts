import type { ApprovalStatus, RequestType } from './common.types'

export interface RequisitionDocumentAccessories {
  adapter: boolean
  mouse: boolean
  pen: boolean
  bag: boolean
  other: string | null
}

// Snapshot ตอนสร้างคำขอ ใช้พิมพ์ "ใบส่งมอบ-ส่งคืนทรัพย์สินของบริษัท" — ไม่อ้างอิงสดจาก employee
// เพื่อไม่ให้เอกสารของคำขอเก่าเปลี่ยนไปตามข้อมูล employee ที่อัปเดตภายหลัง (ดู requisitions.service.ts ฝั่ง backend)
export interface RequisitionDocumentInfo {
  employeeNameEn: string | null
  startDate: string | null
  position: string | null
  department: string | null
  contactPhone: string | null
  accessories: RequisitionDocumentAccessories | null
}

export interface RequisitionItem {
  requisitionItemId: number
  requisitionId: number
  assetId: number | null
  asset?: { assetId: number; assetNo: string; assetName: string; brand: string | null; model: string | null; serialNumber: string | null; notes: string | null } | null
  stockItemId: number | null
  stockItem?: { stockItemId: number; itemName: string } | null
  quantity: number | null
  note: string | null
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
  requestedByEmployee?: {
    employeeId: number
    fullName: string
    employeeCode?: string
    position?: string | null
    department?: { departmentName: string } | null
  } | null
  requestType: RequestType
  overallStatus: ApprovalStatus
  dueDate: string | null
  reason: string | null
  documentInfo: RequisitionDocumentInfo | null
  items: RequisitionItem[]
  approvals: RequisitionApproval[]
  createdAt: string
  updatedAt: string | null
}

export interface RequisitionItemInput {
  assetId?: number
  stockItemId?: number
  quantity?: number
  note?: string
}

export interface CreateRequisitionDto {
  requestType: RequestType
  dueDate?: string
  reason?: string
  onBehalfOfEmployeeId?: number
  employeeNameEn?: string
  startDate?: string
  position?: string
  department?: string
  contactPhone?: string
  accessories?: Partial<RequisitionDocumentAccessories>
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
