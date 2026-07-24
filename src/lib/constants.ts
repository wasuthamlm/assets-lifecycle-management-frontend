import {
  ApprovalStatus,
  AssetStatus,
  AssignmentType,
  DisposalMethod,
  HolderType,
  MovementType,
  PoStatus,
  RepairResult,
  RepairStatus,
  RequestType,
  ReturnCondition,
  WarrantyStatus,
} from '@/api/types/common.types'

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'รอดำเนินการ',
  [ApprovalStatus.APPROVED]: 'อนุมัติแล้ว',
  [ApprovalStatus.REJECTED]: 'ไม่อนุมัติ',
}

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  [AssetStatus.IN_STOCK]: 'พร้อมใช้งาน',
  [AssetStatus.ASSIGNED]: 'เบิกใช้งานแล้ว',
  [AssetStatus.UNDER_REPAIR]: 'ซ่อมบำรุง',
  [AssetStatus.IN_TRANSIT]: 'ระหว่างขนย้าย',
  [AssetStatus.DISPOSED]: 'จำหน่ายแล้ว',
  [AssetStatus.EXPIRED]: 'หมดอายุ',
}

export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  [PoStatus.DRAFT]: 'ร่าง',
  [PoStatus.ORDERED]: 'สั่งซื้อแล้ว',
  [PoStatus.PARTIALLY_RECEIVED]: 'รับของบางส่วน',
  [PoStatus.RECEIVED]: 'รับของครบแล้ว',
  [PoStatus.CANCELLED]: 'ยกเลิก',
}

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  [RequestType.WITHDRAW]: 'เบิก',
  [RequestType.BORROW]: 'ยืม',
}

export const WARRANTY_STATUS_LABEL: Record<WarrantyStatus, string> = {
  [WarrantyStatus.ACTIVE]: 'มีผลคุ้มครอง',
  [WarrantyStatus.EXPIRED]: 'หมดอายุ',
  [WarrantyStatus.RENEWED]: 'ต่ออายุแล้ว',
}

export const DISPOSAL_METHOD_LABEL: Record<DisposalMethod, string> = {
  [DisposalMethod.SOLD]: 'ขาย',
  [DisposalMethod.DONATED]: 'บริจาค',
  [DisposalMethod.DESTROYED]: 'ทำลาย',
  [DisposalMethod.WRITTEN_OFF]: 'ตัดจำหน่าย',
}

export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  [RepairStatus.REPORTED]: 'แจ้งซ่อม',
  [RepairStatus.REPAIRING]: 'กำลังซ่อม',
  [RepairStatus.SENT_TO_VENDOR]: 'ส่งซ่อมภายนอก',
  [RepairStatus.REPAIRED]: 'ซ่อมเสร็จแล้ว',
  [RepairStatus.CLOSED]: 'ปิดงาน',
}

export const REPAIR_RESULT_LABEL: Record<RepairResult, string> = {
  [RepairResult.FIXED]: 'ซ่อมสำเร็จ',
  [RepairResult.UNREPAIRABLE]: 'ซ่อมไม่ได้',
  [RepairResult.WAITING_PARTS]: 'รออะไหล่',
}

export const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  [AssignmentType.PERMANENT]: 'ถาวร',
  [AssignmentType.TEMPORARY_LOAN]: 'ยืมชั่วคราว',
  [AssignmentType.REPLACEMENT]: 'ทดแทน',
}

export const HOLDER_TYPE_LABEL: Record<HolderType, string> = {
  [HolderType.EMPLOYEE]: 'พนักงาน',
  [HolderType.DEPARTMENT]: 'แผนก',
  [HolderType.LOCATION]: 'สถานที่',
  [HolderType.VENDOR]: 'ผู้ขาย',
}

export const RETURN_CONDITION_LABEL: Record<ReturnCondition, string> = {
  [ReturnCondition.NORMAL]: 'ปกติ',
  [ReturnCondition.DAMAGED]: 'ชำรุด',
  [ReturnCondition.LOST]: 'สูญหาย',
}

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  [MovementType.RECEIVED_TO_STOCK]: 'รับเข้าคลัง',
  [MovementType.ISSUED]: 'เบิกจ่าย',
  [MovementType.RETURNED]: 'รับคืน',
  [MovementType.TRANSFERRED_DEPARTMENT]: 'โอนย้ายแผนก',
  [MovementType.TRANSFERRED_LOCATION]: 'โอนย้ายสถานที่',
  [MovementType.SENT_TO_REPAIR]: 'ส่งซ่อม',
  [MovementType.RETURNED_FROM_REPAIR]: 'รับคืนจากซ่อม',
  [MovementType.WARRANTY_RENEWED]: 'ต่อประกัน',
  [MovementType.DISPOSED]: 'จำหน่ายทิ้ง',
}
