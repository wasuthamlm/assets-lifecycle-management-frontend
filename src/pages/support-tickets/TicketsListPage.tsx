import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useSupportTicketsQuery } from '@/hooks/useSupportTickets'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Card } from '@/components/ui/Card'
import { SupportTabs } from '@/components/support/SupportTabs'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { TicketExportModal } from '@/components/support/TicketExportModal'
import { TicketPriorityPill, TicketStatusPill } from '@/components/ui/StatusPill'
import { TicketCategory, TicketSource, TicketStatus } from '@/api/types/common.types'
import { TicketSourceBadge } from '@/components/support/TicketSourceBadge'
import { TICKET_CATEGORY_LABEL, TICKET_STATUS_LABEL } from '@/lib/constants'
import { formatThaiDateTime } from '@/lib/formatters'
import { formatTicketLocation } from '@/lib/supportTicket'
import { cn } from '@/lib/utils'
import type { SupportTicket } from '@/api/types/support-ticket.types'

const PAGE_SIZE = 5

/** เรื่องที่ปิดงานแล้วก็คือแก้ไขแล้วเช่นกัน — การ์ด "แก้ไขแล้ว" จึงนับและกรองรวมทั้งสองสถานะ */
const DONE_FILTER = `${TicketStatus.RESOLVED},${TicketStatus.CLOSED}`

/** filter เป็นค่าเดียวกันทั้งตอนนับจำนวนและตอนกดกรองตาราง ตัวเลขบนการ์ดจึงตรงกับจำนวนแถวเสมอ */
const SUMMARY_CARDS = [
  { filter: TicketStatus.OPEN, label: TICKET_STATUS_LABEL[TicketStatus.OPEN], accent: 'text-amber-600 dark:text-amber-400' },
  { filter: TicketStatus.IN_PROGRESS, label: TICKET_STATUS_LABEL[TicketStatus.IN_PROGRESS], accent: 'text-brand-600 dark:text-brand-400' },
  { filter: DONE_FILTER, label: TICKET_STATUS_LABEL[TicketStatus.RESOLVED], accent: 'text-emerald-600 dark:text-emerald-400' },
]

/**
 * หน้าจัดการ ticket ทุกคน (ticket.view_all) — it_admin และ hr เห็นเหมือนกัน
 * ปุ่มดำเนินการอยู่ในหน้ารายละเอียดเท่านั้น และแสดงเฉพาะคนมี ticket.manage
 */
export function TicketsListPage() {
  usePageTitle('แจ้งปัญหากับ IT')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useSupportTicketsQuery({
    search: debouncedSearch || undefined,
    status: status || undefined,
    category: (category || undefined) as TicketCategory | undefined,
    source: (source || undefined) as TicketSource | undefined,
    // รอดำเนินการขึ้นก่อน → กำลังดำเนินการ → แก้ไขแล้ว → ปิดงาน → ยกเลิก (ใหม่สุดก่อนในแต่ละสถานะ)
    sort: 'status',
    page,
    limit: PAGE_SIZE,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, category, source])

  const columns: DataTableColumn<SupportTicket>[] = [
    {
      key: 'no',
      header: 'เลขที่',
      render: (t) => (
        <div className="flex flex-col items-start gap-1">
          <span className="whitespace-nowrap font-medium">{t.ticketNo}</span>
          <TicketSourceBadge source={t.source} />
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'เรื่องที่แจ้ง',
      render: (t) => (
        <div className="min-w-[12rem]">
          <p className="font-medium text-slate-800 dark:text-slate-100">{t.subject}</p>
          <p className="text-xs text-slate-400">
            {TICKET_CATEGORY_LABEL[t.category]}
            {t.asset ? ` · ${t.asset.assetNo}` : t.assetText ? ` · ${t.assetText}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'ผู้แจ้ง / แผนก / ฝ่าย',
      render: (t) => (
        <div>
          <p>{t.reporterInfo.fullName}</p>
          <p className="text-xs text-slate-400">
            {[t.reporterInfo.departmentName, t.reporterInfo.divisionName].filter(Boolean).join(' · ') || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'สถานที่',
      render: (t) => <span className="block min-w-[8rem] max-w-[14rem]">{formatTicketLocation(t) || '-'}</span>,
    },
    {
      key: 'phone',
      header: 'เบอร์โทร',
      render: (t) => <span className="whitespace-nowrap">{t.reporterInfo.phone ?? '-'}</span>,
    },
    { key: 'priority', header: 'ความเร่งด่วน', render: (t) => <TicketPriorityPill priority={t.priority} /> },
    { key: 'status', header: 'สถานะ', render: (t) => <TicketStatusPill status={t.status} /> },
    { key: 'assignee', header: 'ผู้รับงาน', render: (t) => t.assignedToEmployee?.fullName ?? '-' },
    { key: 'date', header: 'วันที่แจ้ง', render: (t) => <span className="whitespace-nowrap">{formatThaiDateTime(t.createdAt)}</span> },
  ]

  return (
    <div className="space-y-4">
      <SupportTabs current="tickets" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUMMARY_CARDS.map((card) => (
          <StatusSummaryCard
            key={card.filter}
            {...card}
            active={status === card.filter}
            onClick={() => setStatus((prev) => (prev === card.filter ? '' : card.filter))}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาเลขที่ / เรื่อง / ชื่อผู้แจ้ง / เลขทรัพย์สิน / ห้อง..."
          className="max-w-sm"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[11rem]">
          <option value="">ทุกสถานะ</option>
          <option value={DONE_FILTER}>แก้ไขแล้ว + ปิดงาน</option>
          {Object.values(TicketStatus).map((s) => (
            <option key={s} value={s}>
              {TICKET_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-[12rem]">
          <option value="">ทุกประเภท</option>
          {Object.values(TicketCategory).map((c) => (
            <option key={c} value={c}>
              {TICKET_CATEGORY_LABEL[c]}
            </option>
          ))}
        </Select>
        <Select value={source} onChange={(e) => setSource(e.target.value)} className="max-w-[10rem]" aria-label="ช่องทางที่แจ้ง">
          <option value="">ทุกช่องทาง</option>
          <option value={TicketSource.WEB}>แจ้งผ่านเว็บ</option>
          <option value={TicketSource.LINE}>แจ้งผ่าน LINE</option>
        </Select>
        <Button variant="secondary" onClick={() => setExportOpen(true)} className="w-full sm:ml-auto sm:w-auto">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <TicketExportModal open={exportOpen} onClose={() => setExportOpen(false)} currentSearch={debouncedSearch} />

      <Card className="p-0">
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(t) => t.ticketId}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onRowClick={(t) => navigate(`/support-tickets/${t.ticketId}`)}
            emptyMessage={search || status || category || source ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีการแจ้งปัญหา'}
          />
        </div>
        {data && <Pagination page={page} totalItems={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
      </Card>
    </div>
  )
}

/** นับจำนวนด้วย total ของ query limit=1 ต่อสถานะ — ไม่ต้องเพิ่ม endpoint สรุปฝั่ง backend */
function StatusSummaryCard({
  filter,
  label,
  accent,
  active,
  onClick,
}: {
  filter: string
  label: string
  accent: string
  active: boolean
  onClick: () => void
}) {
  const { data } = useSupportTicketsQuery({ status: filter, limit: 1 })
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-2xl border bg-white p-4 text-left shadow-card transition-all duration-200 hover:shadow-card-hover dark:bg-slate-900',
        active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-100 dark:border-slate-800/80',
      )}
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', accent)}>{data ? data.total : '–'}</p>
    </button>
  )
}
