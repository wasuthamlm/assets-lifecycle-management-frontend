import {
  LayoutDashboard,
  PlusCircle,
  Boxes,
  ClipboardList,
  ArrowLeftRight,
  ShoppingCart,
  PackageCheck,
  Warehouse,
  Wrench,
  ShieldCheck,
  Trash2,
  History,
  User,
  CheckSquare,
  BarChart3,
  Users,
  Building2,
  KeyRound,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  permission?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

export const NAV_TOP: NavItem = {
  label: 'แดชบอร์ด',
  href: '/dashboard',
  icon: LayoutDashboard,
  permission: 'dashboard.view',
}

export const NAV_CREATE_GROUP = {
  label: 'สร้างรายการใหม่',
  icon: PlusCircle,
  items: [
    { label: 'ใบขอเบิก/ยืมทรัพย์สิน', href: '/requisitions/new', icon: ClipboardList, permission: 'requisition.create' },
    { label: 'ใบสั่งซื้อใหม่', href: '/purchasing/new', icon: ShoppingCart, permission: 'po.create' },
    { label: 'ลงทะเบียนทรัพย์สินใหม่', href: '/assets/new', icon: Boxes, permission: 'asset.create' },
  ] satisfies NavItem[],
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { label: 'ทรัพย์สิน', href: '/assets', icon: Boxes, permission: 'asset.view' },
      { label: 'ใบขอเบิก/ยืม', href: '/requisitions', icon: ClipboardList, permission: 'requisition.view_all' },
      { label: 'การเบิก-จ่าย/รับคืน', href: '/assignments', icon: ArrowLeftRight, permission: 'assignment.view' },
      { label: 'ใบสั่งซื้อ', href: '/purchasing', icon: ShoppingCart, permission: 'po.view' },
      { label: 'รับเข้าสินค้า', href: '/goods-receipts', icon: PackageCheck, permission: 'goods_receipt.view' },
      { label: 'คลังพัสดุสิ้นเปลือง', href: '/stock', icon: Warehouse, permission: 'stock.view' },
      { label: 'ซ่อมบำรุง', href: '/repairs', icon: Wrench, permission: 'repair.view' },
      { label: 'ประกัน', href: '/warranty', icon: ShieldCheck, permission: 'warranty.view' },
      { label: 'จำหน่ายทิ้ง', href: '/disposal', icon: Trash2, permission: 'disposal.view' },
    ],
  },
  {
    label: '',
    items: [
      { label: 'ประวัติการเคลื่อนไหว', href: '/movements', icon: History, permission: 'asset.view' },
      { label: 'รายการของฉัน', href: '/my-items', icon: User },
      { label: 'รออนุมัติ', href: '/approvals', icon: CheckSquare, permission: 'requisition.approve' },
      { label: 'รายงาน', href: '/reports', icon: BarChart3, permission: 'dashboard.view' },
    ],
  },
  {
    label: '',
    adminOnly: true,
    items: [
      { label: 'ผู้ใช้งาน/พนักงาน', href: '/employees', icon: Users, permission: 'employee.view_all' },
      { label: 'ข้อมูลหลัก', href: '/master-data', icon: Building2, permission: 'master.manage' },
      { label: 'สิทธิ์การใช้งาน', href: '/roles-permissions', icon: KeyRound, permission: 'rbac.manage' },
      { label: 'ตั้งค่า', href: '/settings', icon: Settings },
    ],
  },
]
