export const PERMISSION_LABELS_TH: Record<string, string> = {
  '*': 'สิทธิ์ทั้งหมด (ผู้ดูแลระบบสูงสุด)',

  'dashboard.view': 'ดูแดชบอร์ด',

  'requisition.view_all': 'ดูใบขอเบิก/ยืมทั้งหมด',
  'requisition.view_own': 'ดูใบขอเบิก/ยืมของตนเอง',
  'requisition.create': 'สร้างใบขอเบิก/ยืม',
  'requisition.approve': 'อนุมัติใบขอเบิก/ยืม',

  'asset.view': 'ดูทรัพย์สิน',
  'asset.create': 'เพิ่มทรัพย์สินใหม่',

  'assignment.return': 'เบิก-จ่าย/รับคืนทรัพย์สิน',

  'po.view': 'ดูใบสั่งซื้อ',
  'po.create': 'สร้างใบสั่งซื้อ',
  'po.approve': 'อนุมัติใบสั่งซื้อ',

  'goods_receipt.view': 'ดูการรับเข้าสินค้า',
  'goods_receipt.create': 'บันทึกรับเข้าสินค้า',

  'stock.view': 'ดูคลังพัสดุสิ้นเปลือง',
  'stock.manage': 'จัดการคลังพัสดุสิ้นเปลือง',

  'repair.view': 'ดูรายการซ่อมบำรุง',
  'repair.create': 'สร้างรายการซ่อมบำรุง',
  'repair.update': 'แก้ไขรายการซ่อมบำรุง',

  'warranty.view': 'ดูข้อมูลประกัน',

  'disposal.view': 'ดูรายการจำหน่ายทิ้ง',
  'disposal.create': 'สร้างรายการจำหน่ายทิ้ง',

  'employee.view_all': 'ดูผู้ใช้งาน/พนักงานทั้งหมด',
  'user.view_all': 'ดูผู้ใช้งานทั้งหมด',

  'rbac.manage': 'จัดการบทบาทและสิทธิ์การใช้งาน',
  'master.manage': 'จัดการข้อมูลหลัก (Master Data)',
}

export function translatePermissionCode(code: string): string {
  return PERMISSION_LABELS_TH[code] ?? code
}
