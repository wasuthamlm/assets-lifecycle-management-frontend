import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supportTicketsService } from '@/api/services/support-tickets.service'
import { TicketCategory, TicketPriority, TicketSource, TicketStatus } from '@/api/types/common.types'
import type { SupportTicket } from '@/api/types/support-ticket.types'
import { TICKET_CATEGORY_LABEL, TICKET_PRIORITY_LABEL, TICKET_STATUS_LABEL } from '@/lib/constants'
import { formatThaiDateTime } from '@/lib/formatters'
import { formatTicketLocation } from '@/lib/supportTicket'
import { getErrorMessage } from '@/lib/errorMessage'

const SOURCE_LABEL: Record<TicketSource, string> = {
  [TicketSource.WEB]: 'เว็บ',
  [TicketSource.LINE]: 'LINE',
}

interface ExportColumn {
  key: string
  label: string
  value: (t: SupportTicket) => string
  /** ติ๊กไว้ตั้งแต่เปิด modal */
  defaultOn: boolean
}

const dt = (v: string | null) => (v ? formatThaiDateTime(v) : '')

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'ticketNo', label: 'เลขที่', value: (t) => t.ticketNo, defaultOn: true },
  { key: 'source', label: 'ช่องทางที่แจ้ง', value: (t) => SOURCE_LABEL[t.source] ?? t.source, defaultOn: true },
  { key: 'subject', label: 'เรื่องที่แจ้ง', value: (t) => t.subject, defaultOn: true },
  { key: 'description', label: 'รายละเอียด', value: (t) => t.description ?? '', defaultOn: false },
  { key: 'category', label: 'ประเภท', value: (t) => TICKET_CATEGORY_LABEL[t.category] ?? t.category, defaultOn: true },
  {
    key: 'asset',
    label: 'ทรัพย์สิน/อุปกรณ์',
    value: (t) => (t.asset ? `${t.asset.assetNo} ${t.asset.assetName}` : (t.assetText ?? '')),
    defaultOn: true,
  },
  { key: 'reporter', label: 'ผู้แจ้ง', value: (t) => t.reporterInfo.fullName, defaultOn: true },
  { key: 'department', label: 'แผนก', value: (t) => t.reporterInfo.departmentName ?? '', defaultOn: true },
  { key: 'division', label: 'ฝ่าย', value: (t) => t.reporterInfo.divisionName ?? '', defaultOn: true },
  { key: 'phone', label: 'เบอร์โทร', value: (t) => t.reporterInfo.phone ?? '', defaultOn: true },
  { key: 'location', label: 'สถานที่', value: (t) => formatTicketLocation(t), defaultOn: true },
  { key: 'priority', label: 'ความเร่งด่วน', value: (t) => TICKET_PRIORITY_LABEL[t.priority] ?? t.priority, defaultOn: true },
  { key: 'status', label: 'สถานะ', value: (t) => TICKET_STATUS_LABEL[t.status] ?? t.status, defaultOn: true },
  { key: 'assignee', label: 'ผู้รับงาน', value: (t) => t.assignedToEmployee?.fullName ?? '', defaultOn: true },
  { key: 'resolution', label: 'ผลการแก้ไข', value: (t) => t.resolution ?? '', defaultOn: false },
  { key: 'createdAt', label: 'วันที่แจ้ง', value: (t) => dt(t.createdAt), defaultOn: true },
  { key: 'resolvedAt', label: 'วันที่แก้ไขเสร็จ', value: (t) => dt(t.resolvedAt), defaultOn: false },
  { key: 'closedAt', label: 'วันที่ปิดงาน', value: (t) => dt(t.closedAt), defaultOn: false },
]

const ALL_STATUSES = Object.values(TicketStatus)
const ALL_CATEGORIES = Object.values(TicketCategory)
const ALL_PRIORITIES = Object.values(TicketPriority)
const ALL_SOURCES = Object.values(TicketSource)

const FETCH_PAGE_SIZE = 200
const MAX_PAGES = 100

/** escape ตามมาตรฐาน CSV + กัน formula injection เวลาเปิดใน Excel (ค่าที่ขึ้นต้นด้วย = + - @) */
function csvCell(raw: string): string {
  let v = raw.replace(/\r?\n/g, ' ')
  if (/^[=+\-@\t]/.test(v)) v = `'${v}`
  return `"${v.replace(/"/g, '""')}"`
}

function buildCsv(rows: SupportTicket[], columns: ExportColumn[]): string {
  const header = columns.map((c) => csvCell(c.label)).join(',')
  const body = rows.map((t) => columns.map((c) => csvCell(c.value(t))).join(','))
  // BOM ให้ Excel อ่านภาษาไทยเป็น UTF-8 ถูกต้อง
  return '﻿' + [header, ...body].join('\r\n')
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function timestamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

interface TicketExportModalProps {
  open: boolean
  onClose: () => void
  /** คำค้นหาที่พิมพ์อยู่ในหน้ารายการ — ให้เลือกได้ว่าจะใช้กรองตอน export ด้วยหรือไม่ */
  currentSearch?: string
}

export function TicketExportModal({ open, onClose, currentSearch }: TicketExportModalProps) {
  const [columns, setColumns] = useState<string[]>(() => EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.key))
  const [statuses, setStatuses] = useState<TicketStatus[]>(ALL_STATUSES)
  const [categories, setCategories] = useState<TicketCategory[]>(ALL_CATEGORIES)
  const [priorities, setPriorities] = useState<TicketPriority[]>(ALL_PRIORITIES)
  const [sources, setSources] = useState<TicketSource[]>(ALL_SOURCES)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [useSearch, setUseSearch] = useState(true)
  const [exporting, setExporting] = useState(false)

  const search = currentSearch?.trim() ?? ''
  const canExport =
    columns.length > 0 && statuses.length > 0 && categories.length > 0 && priorities.length > 0 && sources.length > 0

  async function handleExport() {
    setExporting(true)
    try {
      // สถานะกรองที่ backend (รองรับหลายค่าคั่นคอมมา) ที่เหลือกรองฝั่งหน้าเว็บ
      const statusParam = statuses.length === ALL_STATUSES.length ? undefined : statuses.join(',')
      const all: SupportTicket[] = []
      for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await supportTicketsService.list({
          search: useSearch && search ? search : undefined,
          status: statusParam,
          sort: 'status',
          page,
          limit: FETCH_PAGE_SIZE,
        })
        all.push(...res.data)
        if (all.length >= res.total || res.data.length === 0) break
      }

      const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity
      const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Infinity
      const rows = all.filter((t) => {
        const created = new Date(t.createdAt).getTime()
        return (
          categories.includes(t.category) &&
          priorities.includes(t.priority) &&
          sources.includes(t.source) &&
          created >= from &&
          created <= to
        )
      })

      if (rows.length === 0) {
        toast.info('ไม่มีข้อมูลตรงกับเงื่อนไขที่เลือก')
        return
      }

      const selectedColumns = EXPORT_COLUMNS.filter((c) => columns.includes(c.key))
      downloadCsv(buildCsv(rows, selectedColumns), `support-tickets-${timestamp()}.csv`)
      toast.success(`Export สำเร็จ ${rows.length} รายการ`)
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Export ข้อมูลแจ้งปัญหา (CSV)" size="xl">
      <div className="space-y-5">
        <CheckGroup
          title="คอลัมน์ที่ต้องการ"
          hint="ติ๊กออกเพื่อไม่เอาข้อมูลส่วนนั้นใส่ไฟล์"
          options={EXPORT_COLUMNS.map((c) => ({ value: c.key, label: c.label }))}
          selected={columns}
          onToggle={(v) => setColumns((prev) => toggle(prev, v))}
          onAll={(on) => setColumns(on ? EXPORT_COLUMNS.map((c) => c.key) : [])}
        />
        <CheckGroup
          title="สถานะ"
          options={ALL_STATUSES.map((s) => ({ value: s, label: TICKET_STATUS_LABEL[s] }))}
          selected={statuses}
          onToggle={(v) => setStatuses((prev) => toggle(prev, v))}
          onAll={(on) => setStatuses(on ? ALL_STATUSES : [])}
        />
        <CheckGroup
          title="ประเภท"
          options={ALL_CATEGORIES.map((c) => ({ value: c, label: TICKET_CATEGORY_LABEL[c] }))}
          selected={categories}
          onToggle={(v) => setCategories((prev) => toggle(prev, v))}
          onAll={(on) => setCategories(on ? ALL_CATEGORIES : [])}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <CheckGroup
            title="ความเร่งด่วน"
            options={ALL_PRIORITIES.map((p) => ({ value: p, label: TICKET_PRIORITY_LABEL[p] }))}
            selected={priorities}
            onToggle={(v) => setPriorities((prev) => toggle(prev, v))}
            onAll={(on) => setPriorities(on ? ALL_PRIORITIES : [])}
          />
          <CheckGroup
            title="ช่องทางที่แจ้ง"
            options={ALL_SOURCES.map((s) => ({ value: s, label: SOURCE_LABEL[s] }))}
            selected={sources}
            onToggle={(v) => setSources((prev) => toggle(prev, v))}
            onAll={(on) => setSources(on ? ALL_SOURCES : [])}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">ช่วงวันที่แจ้ง</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-500 dark:text-slate-400">
              ตั้งแต่
              <Input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-400">
              ถึง
              <Input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
            </label>
          </div>
          <p className="mt-1 text-xs text-slate-400">เว้นว่างไว้ = ทุกวันที่</p>
        </div>

        {search && (
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={useSearch}
              onChange={(e) => setUseSearch(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
            />
            ใช้คำค้นหาปัจจุบันด้วย: <span className="font-medium">"{search}"</span>
          </label>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {!canExport && <span className="mr-auto text-xs text-red-500">ต้องเลือกอย่างน้อย 1 ตัวเลือกในทุกหัวข้อ</span>}
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={handleExport} disabled={!canExport} loading={exporting}>
            <Download size={16} /> ดาวน์โหลด CSV
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CheckGroup<T extends string>({
  title,
  hint,
  options,
  selected,
  onToggle,
  onAll,
}: {
  title: string
  hint?: string
  options: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
  onAll: (on: boolean) => void
}) {
  const allOn = selected.length === options.length
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
          {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
        <button type="button" onClick={() => onAll(!allOn)} className="text-xs text-brand-600 hover:underline">
          {allOn ? 'ไม่เลือกทั้งหมด' : 'เลือกทั้งหมด'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value)
          return (
            <label
              key={o.value}
              className={
                'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors duration-150 ' +
                (on
                  ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400')
              }
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(o.value)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
              />
              {o.label}
            </label>
          )
        })}
      </div>
    </div>
  )
}
