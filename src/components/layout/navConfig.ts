import {
  LayoutDashboard,
  PlusCircle,
  Boxes,
  ClipboardList,
  ArrowLeftRight,
  ShoppingCart,
  PackageCheck,
  Warehouse,
  ShieldCheck,
  Trash2,
  History,
  User,
  CheckSquare,
  BarChart3,
  Users,
  KeyRound,
  Settings,
  Headset,
  LifeBuoy,
  MessageSquareWarning,
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
  /** active เฉพาะตอน path ตรงตัว — ใช้เมื่อมีเมนูอื่นเป็น sub-path ของเมนูนี้ (เช่น /support-tickets กับ /support-tickets/mine) */
  end?: boolean
  /** active ด้วยเมื่ออยู่ใต้ path เหล่านี้ — ใช้กับเมนูที่รวมหลายหน้าเป็นแท็บ (เช่น แจ้งปัญหากับ IT รวม /repairs) */
  activePaths?: string[]
}

export interface NavGroup {
  /** หัวข้อกลุ่ม (แสดงตอน sidebar กางอยู่เท่านั้น) */
  label: string
  items: NavItem[]
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
    { label: 'แจ้งปัญหา IT', href: '/support-tickets/new', icon: Headset, permission: 'ticket.create' },
    { label: 'เพิ่มทรัพย์สินใหม่', href: '/assets/new', icon: Boxes, permission: 'asset.create' },
    { label: 'สร้างใบสั่งซื้อ', href: '/purchasing/new', icon: ShoppingCart, permission: 'po.create' },
  ] satisfies NavItem[],
}

/**
 * เรียงจากสิ่งที่คนส่วนใหญ่ใช้บ่อยสุดลงไปหาเมนูเฉพาะ it_admin — พนักงานทั่วไปเห็นแค่ 2 กลุ่มบน (ไม่ต้องเลื่อน)
 * hr เห็นถึงกลุ่ม "ข้อมูลและรายงาน" ส่วน 2 กลุ่มล่างสุดเป็นของ it_admin คนเดียว
 * กลุ่มที่ไม่มีเมนูให้เห็นเลยจะถูกซ่อนทั้งกลุ่ม (ดู Sidebar)
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'ของฉัน',
    items: [
      { label: 'รายการของฉัน', href: '/my-items', icon: User },
      { label: 'การแจ้งปัญหาของฉัน', href: '/support-tickets/mine', icon: MessageSquareWarning, permission: 'ticket.view_own' },
    ],
  },
  {
    label: 'งานประจำวัน',
    items: [
      // งานที่มีคนรออยู่ขึ้นก่อนเสมอ — ต้องมีทั้ง 2 สิทธิ์ ให้ตรงกับ PermissionRoute mode="all" ของ /approvals (ดู router.tsx)
      {
        label: 'รออนุมัติ',
        href: '/approvals',
        icon: CheckSquare,
        permission: ['requisition.approve', 'requisition.view_all'],
        permissionMode: 'all',
      },
      {
        label: 'ใบขอเบิก/ยืม',
        href: '/requisitions',
        icon: ClipboardList,
        permission: ['requisition.view_all', 'requisition.view_own'],
      },
      // รวม "เรื่องที่แจ้งเข้ามา" (/support-tickets) กับ "งานซ่อมทรัพย์สิน" (/repairs) เป็นเมนูเดียว แยกด้วยแท็บ
      // (ดู SupportTabs) — เดิมแยก 2 เมนูเท่ากันจนสับสนว่าจะใช้อันไหน ทั้งที่เป็นขั้นตอนต่อกันของงานเดียว
      {
        label: 'แจ้งปัญหากับ IT',
        href: '/support-tickets',
        icon: LifeBuoy,
        permission: 'ticket.view_all',
        end: true,
        activePaths: ['/repairs'],
      },
      { label: 'การเบิก-จ่าย/รับคืน', href: '/assignments', icon: ArrowLeftRight, permission: 'assignment.view_all' },
      { label: 'ทรัพย์สิน', href: '/assets', icon: Boxes, permission: 'asset.view' },
    ],
  },
  {
    label: 'ข้อมูลและรายงาน',
    items: [
      { label: 'รายงาน', href: '/reports', icon: BarChart3, permission: 'dashboard.view' },
      { label: 'ประวัติการเคลื่อนไหว', href: '/movements', icon: History, permission: 'asset.view', excludeRoles: ['employee'] },
      // รวมหน้า "บัญชีผู้ใช้งาน" (/users) เข้ามาในหน้านี้แล้ว (ดู EmployeesListPage) — เห็นได้ถ้ามี
      // สิทธิ์ข้อใดข้อหนึ่ง (hr มี employee.view_all) คอลัมน์ roles/สถานะ/ปุ่มกำหนดสิทธิ์ ค่อยเช็ค user.view_all/rbac.manage แยกในหน้าเอง
      { label: 'ผู้ใช้งาน/พนักงาน', href: '/employees', icon: Users, permission: ['employee.view_all', 'user.view_all'] },
    ],
  },
  {
    label: 'จัดซื้อและคลัง',
    items: [
      { label: 'ใบสั่งซื้อ', href: '/purchasing', icon: ShoppingCart, permission: 'po.view' },
      { label: 'รับเข้าสินค้า', href: '/goods-receipts', icon: PackageCheck, permission: 'goods_receipt.view' },
      { label: 'คลังพัสดุสิ้นเปลือง', href: '/stock', icon: Warehouse, permission: 'stock.view' },
      { label: 'ประกัน', href: '/warranty', icon: ShieldCheck, permission: 'asset.view', excludeRoles: ['employee', 'hr'] },
      { label: 'จำหน่ายทิ้ง', href: '/disposal', icon: Trash2, permission: 'disposal.view' },
    ],
  },
  {
    label: 'ผู้ดูแลระบบ',
    items: [
      { label: 'สิทธิ์การใช้งาน', href: '/roles-permissions', icon: KeyRound, permission: 'rbac.manage' },
      { label: 'ตั้งค่า', href: '/settings', icon: Settings, permission: 'master.manage' },
    ],
  },
]
