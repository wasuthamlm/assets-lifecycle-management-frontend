import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useMySupportTicketsQuery } from '@/hooks/useSupportTickets'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePermission } from '@/hooks/usePermission'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { TicketPriorityPill, TicketStatusPill } from '@/components/ui/StatusPill'
import { TicketPriority, TicketStatus } from '@/api/types/common.types'
import { TICKET_CATEGORY_LABEL, TICKET_STATUS_LABEL } from '@/lib/constants'
import { TICKET_CATEGORY_ICON, formatTicketLocation } from '@/lib/supportTicket'
import { TicketSourceBadge } from '@/components/support/TicketSourceBadge'
import { formatThaiDateTime } from '@/lib/formatters'

const PAGE_SIZE = 10

/** หน้า "การแจ้งปัญหาของฉัน" — ทุก role เห็นเฉพาะ ticket ที่ตัวเองแจ้ง (GET /support-tickets/mine) */
export function MyTicketsPage() {
  usePageTitle('การแจ้งปัญหาของฉัน')
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useMySupportTicketsQuery({
    search: debouncedSearch || undefined,
    status: (status || undefined) as TicketStatus | undefined,
    page,
    limit: PAGE_SIZE,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const canCreate = hasPermission('ticket.create')
  const tickets = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / เรื่อง..." className="max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[11rem]">
            <option value="">ทุกสถานะ</option>
            {Object.values(TicketStatus).map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/support-tickets/new')}>
            <Plus size={16} /> แจ้งปัญหา
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="py-10">
          <ErrorState message="โหลดรายการแจ้งปัญหาไม่สำเร็จ" onRetry={refetch} />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <EmptyState
            message={search || status ? 'ไม่พบรายการที่ค้นหา' : 'คุณยังไม่เคยแจ้งปัญหา'}
            action={
              canCreate && !search && !status ? (
                <Button size="sm" onClick={() => navigate('/support-tickets/new')}>
                  <Plus size={16} /> แจ้งปัญหา
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {tickets.map((t) => {
              const Icon = TICKET_CATEGORY_ICON[t.category]
              return (
                <li key={t.ticketId}>
                  <Link
                    to={`/support-tickets/${t.ticketId}`}
                    className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-slate-800/80 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Icon size={14} />
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t.ticketNo}</span>· {TICKET_CATEGORY_LABEL[t.category]}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <TicketSourceBadge source={t.source} />
                        {(t.priority === TicketPriority.HIGH || t.priority === TicketPriority.URGENT) && (
                          <TicketPriorityPill priority={t.priority} />
                        )}
                        <TicketStatusPill status={t.status} />
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-slate-800 dark:text-slate-100">{t.subject}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {[
                        t.asset ? `${t.asset.assetNo} ${t.asset.assetName}` : t.assetText || null,
                        formatTicketLocation(t) || null,
                        t.assignedToEmployee ? `ผู้รับงาน: ${t.assignedToEmployee.fullName}` : null,
                        formatThaiDateTime(t.createdAt),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
          {data && <Pagination page={page} totalItems={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}
