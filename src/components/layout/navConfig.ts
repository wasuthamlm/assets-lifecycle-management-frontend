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
  KeyRound,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** string[] = มีสิทธิ์ข้อใดข้อหนึ่งก็เห็น (any-of) เช่น requisition.view_all หรือ view_own อย่างใดอย่างหนึ่งก็พอ
   * ยกเว้นตั้ง permissionMode: 'all' — ให้ 'ต้องมีครบทุกข้อ' แทน (ใช้เมื่อหน้าปลายทางต้องการหลายสิทธิ์พร้อมกันจริง) */
  permission?: string | string[]
  permissionMode?: 'any' | 'all'
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
      // อยู่บนสุดของกลุ่มเมนูหลักเสมอ (ใต้แดชบอร์ด) — งานที่ต้องรีบทำ (มีคนรออนุมัติอยู่) ควรเด่นกว่ารายการข้อมูลทั่วไป
      // ต้องมีทั้ง 2 สิทธิ์ — ให้ตรงกับ PermissionRoute mode="all" ของ /approvals (ดู router.tsx)
      {
        label: 'รออนุมัติ',
        href: '/approvals',
        icon: CheckSquare,
        permission: ['requisition.approve', 'requisition.view_all'],
        permissionMode: 'all',
      },
      { label: 'ทรัพย์สิน', href: '/assets', icon: Boxes, permission: 'asset.view' },
      {
        label: 'ใบขอเบิก/ยืม',
        href: '/requisitions',
        icon: ClipboardList,
        permission: ['requisition.view_all', 'requisition.view_own'],
      },
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
      { label: 'รายงาน', href: '/reports', icon: BarChart3, permission: 'dashboard.view' },
    ],
  },
  {
    label: '',
    adminOnly: true,
    items: [
      // รวมหน้า "บัญชีผู้ใช้งาน" (/users) เข้ามาในหน้านี้แล้ว (ดู EmployeesListPage) — เห็นได้ถ้ามี
      // สิทธิ์ข้อใดข้อหนึ่ง คอลัมน์ roles/สถานะ/ปุ่มกำหนดสิทธิ์ ค่อยเช็ค user.view_all/rbac.manage แยกในหน้าเอง
      { label: 'ผู้ใช้งาน/พนักงาน', href: '/employees', icon: Users, permission: ['employee.view_all', 'user.view_all'] },
      { label: 'สิทธิ์การใช้งาน', href: '/roles-permissions', icon: KeyRound, permission: 'rbac.manage' },
      { label: 'ตั้งค่า', href: '/settings', icon: Settings, permission: 'master.manage' },
    ],
  },
]
