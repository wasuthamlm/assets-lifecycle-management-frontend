import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { usePageTitleContext } from '@/hooks/usePageTitle'

const SEGMENT_LABELS: Record<string, string> = {
  assets: 'ทรัพย์สิน',
  requisitions: 'ใบขอเบิก/ยืม',
  assignments: 'การเบิก-จ่าย/รับคืน',
  purchasing: 'ใบสั่งซื้อ',
  'goods-receipts': 'รับเข้าสินค้า',
  stock: 'คลังพัสดุสิ้นเปลือง',
  repairs: 'ซ่อมบำรุง',
  warranty: 'ประกัน',
  disposal: 'จำหน่ายทิ้ง',
  movements: 'ประวัติการเคลื่อนไหว',
  'my-items': 'รายการของฉัน',
  approvals: 'รออนุมัติ',
  reports: 'รายงาน',
  employees: 'ผู้ใช้งาน/พนักงาน',
  'roles-permissions': 'สิทธิ์การใช้งาน',
  users: 'ผู้ใช้งาน',
  settings: 'ตั้งค่า',
}

export function Breadcrumbs() {
  const location = useLocation()
  const { title } = usePageTitleContext()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0 || segments[0] === 'dashboard') return null

  const rootSegment = segments[0]
  const rootLabel = SEGMENT_LABELS[rootSegment] ?? title
  const rootHref = `/${rootSegment}`
  const hasLeaf = segments.length > 1
  const leafLabel = segments[1] === 'new' ? 'สร้างใหม่' : title

  return (
    <nav aria-label="breadcrumb" className="mb-1 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
      <Link to="/dashboard" className="flex items-center hover:text-brand-600 dark:hover:text-brand-400">
        <Home size={13} />
      </Link>
      <ChevronRight size={12} className="shrink-0" />
      {hasLeaf ? (
        <Link to={rootHref} className="truncate hover:text-brand-600 dark:hover:text-brand-400">
          {rootLabel}
        </Link>
      ) : (
        <span className="truncate text-slate-500 dark:text-slate-400">{rootLabel}</span>
      )}
      {hasLeaf && (
        <>
          <ChevronRight size={12} className="shrink-0" />
          <span className="truncate text-slate-500 dark:text-slate-400">{leafLabel}</span>
        </>
      )}
    </nav>
  )
}
