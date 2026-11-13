import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { lineService } from '@/api/services/line.service'
import type { SupportTicket } from '@/api/types/support-ticket.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TicketStatusPill } from '@/components/ui/StatusPill'
import { TICKET_CATEGORY_LABEL } from '@/lib/constants'
import { TICKET_CATEGORY_ICON } from '@/lib/supportTicket'
import { formatThaiDateTime } from '@/lib/formatters'
import { handleLiffError, useLiffSession } from './LiffLayout'

const PAGE_SIZE = 10

/** "เรื่องที่ฉันแจ้ง" ใน LINE — รายการ ticket ของตัวเอง (ทั้งที่แจ้งจากเว็บและ LINE) แบบโหลดเพิ่มทีละหน้า */
export function LiffMyTicketsPage() {
  const { idToken } = useLiffSession()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    lineService
      .myTickets(idToken, { page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return
        setTickets((prev) => (page === 1 ? res.data : [...prev, ...res.data]))
        setTotal(res.total)
      })
      .catch((err) => {
        if (!cancelled) handleLiffError(err, 'โหลดรายการไม่สำเร็จ')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [idToken, page])

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">คุณยังไม่เคยแจ้งปัญหา</p>
        <Link to="/liff/support" className="mt-3 inline-block text-sm text-brand-600 hover:underline dark:text-brand-400">
          แจ้งปัญหา
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {tickets.map((t) => {
          const Icon = TICKET_CATEGORY_ICON[t.category]
          return (
            <li key={t.ticketId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Icon size={14} />
                  <span className="font-medium text-slate-600 dark:text-slate-300">{t.ticketNo}</span>· {TICKET_CATEGORY_LABEL[t.category]}
                </span>
                <TicketStatusPill status={t.status} />
              </div>
              <p className="mt-2 font-medium text-slate-800 dark:text-slate-100">{t.subject}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {[t.assignedToEmployee ? `ผู้รับงาน: ${t.assignedToEmployee.fullName}` : null, formatThaiDateTime(t.createdAt)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </li>
          )
        })}
      </ul>
      {tickets.length < total && (
        <Button variant="secondary" className="w-full" loading={isLoading} onClick={() => setPage((p) => p + 1)}>
          โหลดเพิ่ม
        </Button>
      )}
    </div>
  )
}
