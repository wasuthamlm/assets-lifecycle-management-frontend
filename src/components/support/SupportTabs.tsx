import { NavLink } from 'react-router-dom'
import { Inbox, Wrench } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import { useSupportTicketsQuery } from '@/hooks/useSupportTickets'
import { TicketStatus } from '@/api/types/common.types'
import { cn } from '@/lib/utils'

const DESCRIPTION = {
  tickets: 'ปัญหาที่ผู้ใช้แจ้งเข้ามา — แก้หน้างานได้ก็ปิดที่นี่ ถ้าอุปกรณ์เสียจริงให้เปิด ticket แล้วกด "ส่งซ่อม"',
  repairs: 'งานซ่อมตัวทรัพย์สิน (ระหว่างซ่อม สถานะทรัพย์สินเป็น "ซ่อมบำรุง") — ติดตามผู้รับซ่อม ค่าใช้จ่าย และผลซ่อม',
} as const

/**
 * แท็บบนสุดของเมนู "แจ้งปัญหากับ IT" — รวม /support-tickets กับ /repairs ที่เดิมแยกเป็น 2 เมนู
 * แท็บงานซ่อมแสดงเฉพาะคนมี repair.view (it_admin) ส่วน hr เห็นแค่แท็บแรก
 */
export function SupportTabs({ current }: { current: keyof typeof DESCRIPTION }) {
  const { hasPermission } = usePermission()
  const canViewTickets = hasPermission('ticket.view_all')
  const canViewRepairs = hasPermission('repair.view')
  const { data: openTickets } = useSupportTicketsQuery({ status: TicketStatus.OPEN, limit: 1 }, canViewTickets)

  const tabs = [
    canViewTickets && { key: 'tickets', href: '/support-tickets', label: 'เรื่องที่แจ้งเข้ามา', icon: Inbox, count: openTickets?.total },
    canViewRepairs && { key: 'repairs', href: '/repairs', label: 'งานซ่อมทรัพย์สิน', icon: Wrench, count: undefined },
  ].filter((t) => !!t)

  return (
    <div className="space-y-2">
      {tabs.length > 1 && (
        <nav className="flex gap-1 border-b border-slate-200 dark:border-slate-800" aria-label="แจ้งปัญหากับ IT">
          {tabs.map((t) => (
            <NavLink
              key={t.key}
              to={t.href}
              end
              className={({ isActive }) =>
                cn(
                  '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                )
              }
            >
              <t.icon size={16} />
              {t.label}
              {!!t.count && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                  {t.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">{DESCRIPTION[current]}</p>
    </div>
  )
}
