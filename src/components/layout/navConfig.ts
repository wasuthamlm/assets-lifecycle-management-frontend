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
  UserCog,
  KeyRound,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  permission?: string
  /** ซ่อนเมนูนี้ให้ role เหล่านี้ แม้จะมี permission ผ่านก็ตาม (เช่น employee มี asset.view แต่ไม่ควรเห็นประกัน/ประวัติการเคลื่อนไหว) */
  excludeRoles?: string[]
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
    { label: 'เพิ่มทรัพย์สินใหม่', href: '/assets/new', icon: Boxes, permission: 'asset.create' },
    { label: 'สร้างใบสั่งซื้อ', href: '/purchasing/new', icon: ShoppingCart, permission: 'po.create' },
  ] satisfies NavItem[],
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { label: 'ทรัพย์สิน', href: '/assets', icon: Boxes, permission: 'asset.view' },
      { label: 'ใบขอเบิก/ยืม', href: '/requisitions', icon: ClipboardList, permission: 'requisition.view_all' },
      { label: 'การเบิก-จ่าย/รับคืน', href: '/assignments', icon: ArrowLeftRight, permission: 'assignment.return' },
      { label: 'ใบสั่งซื้อ', href: '/purchasing', icon: ShoppingCart, permission: 'po.view' },
      { label: 'รับเข้าสินค้า', href: '/goods-receipts', icon: PackageCheck, permission: 'goods_receipt.view' },
      { label: 'คลังพัสดุสิ้นเปลือง', href: '/stock', icon: Warehouse, permission: 'stock.view' },
      { label: 'ซ่อมบำรุง', href: '/repairs', icon: Wrench, permission: 'repair.view' },
      { label: 'ประกัน', href: '/warranty', icon: ShieldCheck, permission: 'asset.view', excludeRoles: ['employee'] },
      { label: 'จำหน่ายทิ้ง', href: '/disposal', icon: Trash2, permission: 'disposal.view' },
    ],
  },
  {
    label: '',
    items: [
      { label: 'ประวัติการเคลื่อนไหว', href: '/movements', icon: History, permission: 'asset.view', excludeRoles: ['employee'] },
      { label: 'รายการของฉัน', href: '/my-items', icon: User },
      { label: 'ใบขอเบิก/ยืมของฉัน', href: '/my-requisitions', icon: ClipboardList, permission: 'requisition.view_own' },
      { label: 'รออนุมัติ', href: '/approvals', icon: CheckSquare, permission: 'requisition.approve' },
      { label: 'รายงาน', href: '/reports', icon: BarChart3, permission: 'dashboard.view' },
    ],
  },
  {
    label: '',
    adminOnly: true,
    items: [
      { label: 'ผู้ใช้งาน/พนักงาน', href: '/employees', icon: Users, permission: 'employee.view_all' },
      { label: 'บัญชีผู้ใช้งาน', href: '/users', icon: UserCog, permission: 'user.view_all' },
      { label: 'สิทธิ์การใช้งาน', href: '/roles-permissions', icon: KeyRound, permission: 'rbac.manage' },
      { label: 'ตั้งค่า', href: '/settings', icon: Settings, permission: 'master.manage' },
    ],
  },
]
