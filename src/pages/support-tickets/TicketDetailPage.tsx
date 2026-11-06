import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeftRight, Check, MapPin, Phone, Wrench, X } from 'lucide-react'
import {
  useEscalateSupportTicketMutation,
  useSupportTicketQuery,
  useUpdateSupportTicketStatusMutation,
} from '@/hooks/useSupportTickets'
import { useVendorsQuery } from '@/hooks/useMasterData'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RepairStatusPill, TicketPriorityPill, TicketStatusPill } from '@/components/ui/StatusPill'
import type { TimelineStep } from '@/components/ui/Timeline'
import { TicketAttachmentsPanel } from '@/components/attachments/TicketAttachmentsPanel'
import { AssignmentType, TicketStatus } from '@/api/types/common.types'
import { ASSIGNMENT_TYPE_LABEL, TICKET_CATEGORY_LABEL } from '@/lib/constants'
import { ACTIVE_TICKET_STATUSES, TICKET_CATEGORY_ICON, TICKET_STATUS_TRANSITIONS, formatTicketLocation } from '@/lib/supportTicket'
import { formatThaiDate, formatThaiDateTime } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import { cn } from '@/lib/utils'
import type { SupportTicket } from '@/api/types/support-ticket.types'

type ConfirmTarget = TicketStatus.CANCELLED | TicketStatus.CLOSED | null

/**
 * จัดหน้าใหม่ให้อ่านง่าย: บนสุด = เรื่องอะไร + ตอนนี้อยู่ขั้นไหน (ประโยค + แถบความคืบหน้าแนวนอน)
 * ขวา = ใครแจ้ง / ไปที่ไหน / ปุ่มทำงานต่อ (สิ่งที่ IT ต้องใช้ก่อนออกไปหน้างาน) ซ้าย = รายละเอียดปัญหา/อุปกรณ์/รูป
 */
export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)
  const { data: ticket, isLoading, isError, error, refetch } = useSupportTicketQuery(ticketId)
  usePageTitle(ticket ? `Ticket ${ticket.ticketNo}` : 'รายละเอียด Ticket')
  const { hasPermission } = usePermission()
  const currentEmployeeId = useAuthStore((s) => s.user?.employeeId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !ticket) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบ ticket นี้" />
  }

  const canManage = hasPermission('ticket.manage')
  const isOwner = ticket.reportedBy === currentEmployeeId
  const CategoryIcon = TICKET_CATEGORY_ICON[ticket.category]
  const { reporterInfo: reporter } = ticket
  const showActions = canManage && TICKET_STATUS_TRANSITIONS[ticket.status].length > 0

  return (
    <div className="space-y-4">
      <BackLink />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">{ticket.ticketNo}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <CategoryIcon size={14} /> {TICKET_CATEGORY_LABEL[ticket.category]}
              </span>
              <span>·</span>
              <span>แจ้งเมื่อ {formatThaiDateTime(ticket.createdAt)}</span>
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">{ticket.subject}</h1>
          </div>
          <div className="flex items-center gap-2">
            <TicketPriorityPill priority={ticket.priority} />
            <TicketStatusPill status={ticket.status} />
          </div>
        </div>
        <StatusBanner ticket={ticket} />
        <ProgressStepper steps={buildTimeline(ticket)} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* มือถือแสดงก่อน (ใคร/ที่ไหน/ทำอะไรต่อ) จอใหญ่อยู่คอลัมน์ขวา */}
        <aside className="space-y-4 lg:order-2">
          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">ผู้แจ้ง</h2>
            <div>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{reporter.fullName}</p>
              <p className="text-base text-slate-500 dark:text-slate-400">
                {[reporter.departmentName, reporter.divisionName].filter(Boolean).join(' · ') || '-'}
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-base dark:bg-brand-500/10">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
              <span className="font-medium text-brand-900 dark:text-brand-100">{formatTicketLocation(ticket) || 'ไม่ได้ระบุสถานที่'}</span>
            </div>
            {reporter.phone && (
              <a
                href={`tel:${reporter.phone}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-base font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Phone size={16} /> โทร {reporter.phone}
              </a>
            )}
          </Card>

          {showActions && <TicketActionsPanel ticket={ticket} />}
        </aside>

        <div className="space-y-4 lg:order-1">
          {ticket.resolution && (
            <Card
              className={
                ticket.status === TicketStatus.CANCELLED
                  ? 'border-red-100 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5'
                  : 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5'
              }
            >
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {ticket.status === TicketStatus.CANCELLED ? 'เหตุผลที่ยกเลิก' : 'วิธีแก้ไข'}
              </h2>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{ticket.resolution}</p>
            </Card>
          )}

          <Card className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">รายละเอียดปัญหา</h2>
              <p className="mt-1 whitespace-pre-line text-base text-slate-700 dark:text-slate-200">
                {ticket.description || <span className="text-slate-400">ไม่ได้ระบุรายละเอียดเพิ่ม</span>}
              </p>
            </div>
            {ticket.asset && <RelatedAsset ticket={ticket} />}
            <TicketAttachmentsPanel ticketId={ticket.ticketId} canManage={isOwner || canManage} />
          </Card>
        </div>
      </div>
    </div>
  )
}

/** บอกเป็นประโยคว่าตอนนี้เรื่องอยู่ตรงไหน — ไม่ต้องตีความจากป้ายสถานะเอง */
function StatusBanner({ ticket }: { ticket: SupportTicket }) {
  const assignee = ticket.assignedToEmployee?.fullName
  const message: Record<TicketStatus, string> = {
    [TicketStatus.OPEN]: 'รอทีม IT รับเรื่อง',
    [TicketStatus.IN_PROGRESS]: ticket.repairId
      ? `ส่งซ่อมแล้ว${assignee ? ` — ${assignee} ดูแลอยู่` : ''} (ปิดงานซ่อมแล้วเรื่องนี้จะเปลี่ยนเป็นแก้ไขแล้วเอง)`
      : `${assignee ?? 'ทีม IT'} กำลังดำเนินการ`,
    [TicketStatus.RESOLVED]: `แก้ไขเรียบร้อยแล้ว${ticket.resolvedAt ? ` เมื่อ ${formatThaiDateTime(ticket.resolvedAt)}` : ''}`,
    [TicketStatus.CLOSED]: 'ปิดงานแล้ว',
    [TicketStatus.CANCELLED]: 'ยกเลิกเรื่องนี้แล้ว',
  }
  return <p className="text-sm text-slate-600 dark:text-slate-300">{message[ticket.status]}</p>
}

const STEP_DOT: Record<TimelineStep['status'], string> = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-brand-600 text-white ring-4 ring-brand-500/20',
  pending: 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
  rejected: 'bg-red-500 text-white',
}

/** เวลาที่เส้นความคืบหน้าใช้เดินจากขั้นหนึ่งไปขั้นถัดไป — ครึ่งละ 200ms ตาม animate-step-fill */
const STEP_MS = 400

/** ครึ่งเส้นด้านหนึ่งของจุด — target คือขั้นปลายทางของเส้นนี้ ถ้าขั้นนั้นถึงแล้วเส้นจะค่อยๆ เติมสีจากซ้ายไปขวา */
function StepLine({ target, delayMs }: { target: TimelineStep['status'] | undefined; delayMs?: number }) {
  if (!target) return <span className="h-0.5 flex-1" />
  return (
    <span className="relative h-0.5 flex-1 bg-slate-200 dark:bg-slate-700">
      {target !== 'pending' && (
        <span
          className="absolute inset-0 origin-left animate-step-fill bg-emerald-400 motion-reduce:animate-none"
          style={{ animationDelay: delayMs === undefined ? undefined : `${delayMs}ms` }}
        />
      )}
    </span>
  )
}

/**
 * ตอนเปิดหน้า เส้นจะเดินจากขั้นแรกไปถึงขั้นปัจจุบันครั้งเดียว ส่วนขั้นปัจจุบันมีวงแสงจางๆ ให้รู้ว่างานอยู่ตรงนี้
 * พอเปลี่ยนสถานะภายหลัง เฉพาะส่วนที่เพิ่งถึงจะขยับทันที ไม่เล่นใหม่ทั้งเส้น
 */
function ProgressStepper({ steps }: { steps: TimelineStep[] }) {
  const isFirstRender = useRef(true)
  useEffect(() => {
    isFirstRender.current = false
  }, [])
  const delay = (ms: number) => (isFirstRender.current ? ms : undefined)

  return (
    <ol className="flex overflow-x-auto pb-1 pt-2">
      {steps.map((step, i) => (
        <li key={step.label} className="flex min-w-[6.5rem] flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <StepLine target={i === 0 ? undefined : step.status} delayMs={delay((i - 1) * STEP_MS + STEP_MS / 2)} />
            <span className={cn('relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', STEP_DOT.pending)}>
              {i + 1}
              {step.status !== 'pending' && (
                <>
                  {step.status === 'current' && (
                    <span className="absolute inset-0 animate-step-halo rounded-full bg-brand-500 motion-reduce:hidden" />
                  )}
                  <span
                    className={cn(
                      'absolute inset-0 flex animate-scale-in items-center justify-center rounded-full [animation-fill-mode:both] motion-reduce:animate-none',
                      STEP_DOT[step.status],
                    )}
                    style={{ animationDelay: `${delay(i * STEP_MS) ?? 0}ms` }}
                  >
                    {step.status === 'done' ? <Check size={14} /> : step.status === 'rejected' ? <X size={14} /> : i + 1}
                  </span>
                </>
              )}
            </span>
            <StepLine target={steps[i + 1]?.status} delayMs={delay(i * STEP_MS)} />
          </div>
          <p className={cn('mt-1.5 text-xs font-medium', step.status === 'pending' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200')}>
            {step.label}
          </p>
          {(step.timestamp || step.description) && <p className="mt-0.5 px-1 text-[11px] text-slate-400">{step.timestamp ?? step.description}</p>}
        </li>
      ))}
    </ol>
  )
}

function RelatedAsset({ ticket }: { ticket: SupportTicket }) {
  const { hasPermission } = usePermission()
  const { asset, assignment, repair } = ticket
  if (!asset) return null

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">อุปกรณ์ที่มีปัญหา</h2>
      <div className="mt-2 space-y-2 rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800">
        <p>
          <span className="font-medium text-slate-800 dark:text-slate-100">{asset.assetNo}</span>{' '}
          <span className="text-slate-600 dark:text-slate-300">{asset.assetName}</span>
          {hasPermission('asset.view') && (
            <Link to={`/assets/${asset.assetId}`} className="ml-2 text-brand-600 hover:underline dark:text-brand-400">
              ดูทรัพย์สิน
            </Link>
          )}
        </p>
        {assignment && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 dark:text-slate-400">
            <ArrowLeftRight size={14} className="shrink-0" />
            <span>{assignment.assignmentType === AssignmentType.TEMPORARY_LOAN ? 'ของยืม' : ASSIGNMENT_TYPE_LABEL[assignment.assignmentType]}</span>
            <span>· รับไปวันที่ {formatThaiDate(assignment.issuedDate)}</span>
            {assignment.dueDate && <span>· กำหนดคืน {formatThaiDate(assignment.dueDate)}</span>}
            {assignment.requisitionId && (
              <Link to={`/requisitions/${assignment.requisitionId}`} className="text-brand-600 hover:underline dark:text-brand-400">
                · ดูใบขอเบิก/ยืม
              </Link>
            )}
          </p>
        )}
        {repair && (
          <p className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
            <Wrench size={14} className="shrink-0" />
            ส่งซ่อมแล้ว
            {hasPermission('repair.view') ? (
              <Link to={`/repairs/${repair.repairId}`} className="text-brand-600 hover:underline dark:text-brand-400">
                งานซ่อม #{repair.repairId}
              </Link>
            ) : (
              <span>งานซ่อม #{repair.repairId}</span>
            )}
            <RepairStatusPill status={repair.status} />
          </p>
        )}
      </div>
    </div>
  )
}

function buildTimeline(ticket: SupportTicket): TimelineStep[] {
  const isActive = ACTIVE_TICKET_STATUSES.includes(ticket.status)
  const taken = ticket.status !== TicketStatus.OPEN || !!ticket.assignedTo
  const steps: TimelineStep[] = [
    { label: 'แจ้งเรื่อง', timestamp: formatThaiDateTime(ticket.createdAt), status: 'done' },
    {
      label: 'IT รับงาน',
      description: ticket.assignedToEmployee?.fullName,
      status: taken ? (isActive ? 'current' : 'done') : 'current',
    },
  ]
  if (ticket.repairId) {
    steps.push({ label: 'ส่งซ่อม', description: `งานซ่อม #${ticket.repairId}`, status: isActive ? 'current' : 'done' })
  }
  if (ticket.status === TicketStatus.CANCELLED) {
    steps.push({ label: 'ยกเลิก', timestamp: ticket.closedAt ? formatThaiDateTime(ticket.closedAt) : undefined, status: 'rejected' })
    return steps
  }
  steps.push(
    {
      label: 'แก้ไขแล้ว',
      timestamp: ticket.resolvedAt ? formatThaiDateTime(ticket.resolvedAt) : undefined,
      status: ticket.status === TicketStatus.RESOLVED ? 'current' : ticket.status === TicketStatus.CLOSED ? 'done' : 'pending',
    },
    {
      label: 'ปิดงาน',
      timestamp: ticket.closedAt ? formatThaiDateTime(ticket.closedAt) : undefined,
      status: ticket.status === TicketStatus.CLOSED ? 'done' : 'pending',
    },
  )
  return steps
}

/**
 * แสดงเฉพาะคนมี ticket.manage (it_admin) — hr มี view_all แต่ไม่เห็นส่วนนี้เลย
 * ปุ่มหลักตัวเดียว = ขั้นถัดไปของ flow ปกติ (รับงาน → แก้ไขแล้ว → ปิดงาน) ที่เหลือเป็นปุ่มรองด้านล่าง
 */
function TicketActionsPanel({ ticket }: { ticket: SupportTicket }) {
  const updateStatus = useUpdateSupportTicketStatusMutation(ticket.ticketId)
  const [resolution, setResolution] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null)
  const [escalateOpen, setEscalateOpen] = useState(false)

  const allowed = TICKET_STATUS_TRANSITIONS[ticket.status]
  const can = (s: TicketStatus) => allowed.includes(s)
  const canEscalate = !!ticket.assetId && !ticket.repairId && ACTIVE_TICKET_STATUSES.includes(ticket.status)
  const isOpen = ticket.status === TicketStatus.OPEN

  function change(status: TicketStatus, successMessage: string) {
    updateStatus.mutate(
      { status, resolution: resolution.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(successMessage)
          setResolution('')
          setConfirmTarget(null)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'อัปเดตไม่สำเร็จ'))
          setConfirmTarget(null)
        },
      },
    )
  }

  const busy = updateStatus.isPending

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">ดำเนินการ</h2>

      {isOpen && (
        <Button className="w-full" onClick={() => change(TicketStatus.IN_PROGRESS, 'รับงานแล้ว')} loading={busy}>
          รับงานนี้
        </Button>
      )}

      {can(TicketStatus.RESOLVED) && !isOpen && (
        <div className="space-y-2">
          <Textarea
            rows={3}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="แก้ไขอย่างไร เช่น เปลี่ยนสายเส้นใหม่ให้แล้ว"
            aria-label="วิธีแก้ไข"
          />
          <Button className="w-full" onClick={() => change(TicketStatus.RESOLVED, 'บันทึกว่าแก้ไขแล้ว')} loading={busy}>
            <Check size={16} /> แก้ไขเรียบร้อยแล้ว
          </Button>
        </div>
      )}

      {can(TicketStatus.CLOSED) && (
        <Button className="w-full" onClick={() => setConfirmTarget(TicketStatus.CLOSED)} disabled={busy}>
          ปิดงาน
        </Button>
      )}

      <div className="space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
        {canEscalate && (
          <SecondaryAction icon={<Wrench size={16} />} onClick={() => setEscalateOpen(true)} disabled={busy}>
            อุปกรณ์เสียจริง — ส่งซ่อม
          </SecondaryAction>
        )}
        {can(TicketStatus.IN_PROGRESS) && !isOpen && (
          <SecondaryAction onClick={() => change(TicketStatus.IN_PROGRESS, 'เปิดงานใหม่แล้ว')} disabled={busy}>
            ยังไม่หาย — เปิดงานใหม่
          </SecondaryAction>
        )}
        {isOpen && can(TicketStatus.RESOLVED) && (
          <SecondaryAction onClick={() => change(TicketStatus.RESOLVED, 'บันทึกว่าแก้ไขแล้ว')} disabled={busy}>
            แก้ไขเสร็จแล้ว (ไม่ต้องรับงาน)
          </SecondaryAction>
        )}
        {can(TicketStatus.CANCELLED) && (
          <SecondaryAction danger onClick={() => setConfirmTarget(TicketStatus.CANCELLED)} disabled={busy}>
            ยกเลิกเรื่องนี้
          </SecondaryAction>
        )}
      </div>

      <EscalateModal ticket={ticket} open={escalateOpen} onClose={() => setEscalateOpen(false)} />

      {/* ยกเลิก/ปิดงานเป็นสถานะสุดท้าย แก้ต่อไม่ได้ — ต้องยืนยันก่อนเหมือนการปิดงานซ่อม */}
      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget === TicketStatus.CANCELLED ? 'ยกเลิกเรื่องนี้' : 'ปิดงาน'}
        description={
          confirmTarget === TicketStatus.CANCELLED
            ? `ยกเลิก ${ticket.ticketNo} ใช่หรือไม่? หลังยกเลิกแล้วจะเปลี่ยนสถานะต่อไม่ได้อีก`
            : `ปิดงาน ${ticket.ticketNo} ใช่หรือไม่? หลังปิดงานแล้วจะเปลี่ยนสถานะต่อไม่ได้อีก`
        }
        confirmLabel={confirmTarget === TicketStatus.CANCELLED ? 'ยกเลิกเรื่องนี้' : 'ปิดงาน'}
        variant={confirmTarget === TicketStatus.CANCELLED ? 'danger' : 'default'}
        isLoading={busy}
        onConfirm={() => confirmTarget && change(confirmTarget, confirmTarget === TicketStatus.CANCELLED ? 'ยกเลิกแล้ว' : 'ปิดงานแล้ว')}
        onCancel={() => setConfirmTarget(null)}
      />
    </Card>
  )
}

function SecondaryAction({
  children,
  icon,
  danger,
  ...props
}: { children: React.ReactNode; icon?: React.ReactNode; danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 disabled:opacity-50',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

function EscalateModal({ ticket, open, onClose }: { ticket: SupportTicket; open: boolean; onClose: () => void }) {
  const escalate = useEscalateSupportTicketMutation(ticket.ticketId)
  const { data: vendors = [] } = useVendorsQuery()
  const [problemDescription, setProblemDescription] = useState(
    `${ticket.subject}${ticket.description ? ` — ${ticket.description}` : ''}`,
  )
  const [vendorId, setVendorId] = useState('')

  function submit() {
    escalate.mutate(
      {
        problemDescription: problemDescription.trim() ? `[${ticket.ticketNo}] ${problemDescription.trim()}` : undefined,
        vendorId: vendorId ? Number(vendorId) : undefined,
      },
      {
        onSuccess: () => {
          toast.success('สร้างงานซ่อมแล้ว — ปิดงานซ่อมเมื่อไหร่ เรื่องนี้จะเปลี่ยนเป็นแก้ไขแล้วอัตโนมัติ')
          onClose()
        },
        onError: (error) => toast.error(getErrorMessage(error, 'ส่งซ่อมไม่สำเร็จ')),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="ส่งซ่อม">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          ระบบจะสร้างงานซ่อมให้ {ticket.asset?.assetNo} และเปลี่ยนสถานะทรัพย์สินเป็น "ซ่อมบำรุง"
        </p>
        <div>
          <label htmlFor="problemDescription" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            อาการเสียที่ตรวจพบ
          </label>
          <Textarea id="problemDescription" rows={3} value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} />
        </div>
        <div>
          <label htmlFor="vendorId" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            ผู้รับซ่อม (ถ้าส่งซ่อมภายนอก)
          </label>
          <Select id="vendorId" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
            <option value="">ซ่อมภายใน</option>
            {vendors.map((v) => (
              <option key={v.vendorId} value={v.vendorId}>
                {v.vendorName}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={escalate.isPending}>
            ยกเลิก
          </Button>
          <Button onClick={submit} loading={escalate.isPending}>
            <Wrench size={16} /> สร้างงานซ่อม
          </Button>
        </div>
      </div>
    </Modal>
  )
}
