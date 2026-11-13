import type { AssignmentType, RepairStatus, TicketCategory, TicketPriority, TicketSource, TicketStatus } from './common.types'

/** Snapshot ข้อมูลผู้แจ้ง ณ ตอนเปิด ticket — divisionName = ฝ่าย (แผนกแม่) */
export interface TicketReporterInfo {
  fullName: string
  departmentName: string | null
  divisionName: string | null
  phone: string | null
}

export interface SupportTicket {
  ticketId: number
  ticketNo: string
  /** web = แจ้งผ่านเว็บ, line = แจ้งผ่าน LINE OA */
  source: TicketSource
  reportedBy: number
  reporterInfo: TicketReporterInfo
  category: TicketCategory
  subject: string
  description: string | null
  priority: TicketPriority
  assetId: number | null
  asset?: { assetId: number; assetNo: string; assetName: string } | null
  /** ชื่ออุปกรณ์ที่ผู้แจ้งพิมพ์เอง (ไม่ได้เลือกจากของที่ถือ/ยืมอยู่) */
  assetText: string | null
  assignmentId: number | null
  assignment?: {
    assignmentId: number
    assignmentType: AssignmentType
    issuedDate: string
    dueDate: string | null
    returnedDate: string | null
    requisitionId: number | null
  } | null
  locationId: number | null
  location?: { locationId: number; locationName: string; site: string | null } | null
  /** ชั้น/ห้อง/โต๊ะ ที่ทีม IT ต้องเดินไป */
  locationDetail: string
  status: TicketStatus
  assignedTo: number | null
  assignedToEmployee?: { employeeId: number; fullName: string } | null
  repairId: number | null
  repair?: { repairId: number; status: RepairStatus } | null
  resolution: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface QueryTicketDto {
  search?: string
  /** สถานะเดียว หรือหลายสถานะคั่นด้วยคอมมา เช่น "resolved,closed" */
  status?: string
  category?: TicketCategory
  source?: TicketSource
  page?: number
  limit?: number
}

export interface CreateTicketDto {
  category: TicketCategory
  subject: string
  description?: string
  priority?: TicketPriority
  assetId?: number
  assetText?: string
  locationId?: number
  locationDetail: string
  contactPhone?: string
}

export interface UpdateTicketStatusDto {
  status: TicketStatus
  assignedTo?: number
  priority?: TicketPriority
  resolution?: string
}

export interface EscalateToRepairDto {
  problemDescription?: string
  vendorId?: number
}
