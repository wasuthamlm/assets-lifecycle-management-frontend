import { cn } from '@/lib/utils'
import { ApprovalStatus, AssetStatus, PoStatus, RepairStatus, WarrantyStatus } from '@/api/types/common.types'
import {
  APPROVAL_STATUS_LABEL,
  ASSET_STATUS_LABEL,
  PO_STATUS_LABEL,
  REPAIR_STATUS_LABEL,
  WARRANTY_STATUS_LABEL,
} from '@/lib/constants'

const APPROVAL_COLORS: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  [ApprovalStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  [ApprovalStatus.REJECTED]: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

const ASSET_COLORS: Record<AssetStatus, string> = {
  [AssetStatus.IN_STOCK]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  [AssetStatus.ASSIGNED]: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  [AssetStatus.UNDER_REPAIR]: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  [AssetStatus.IN_TRANSIT]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  [AssetStatus.DISPOSED]: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  [AssetStatus.EXPIRED]: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

const PO_COLORS: Record<PoStatus, string> = {
  [PoStatus.DRAFT]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  [PoStatus.ORDERED]: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  [PoStatus.PARTIALLY_RECEIVED]: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  [PoStatus.RECEIVED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  [PoStatus.CANCELLED]: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

const WARRANTY_COLORS: Record<WarrantyStatus, string> = {
  [WarrantyStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  [WarrantyStatus.EXPIRED]: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  [WarrantyStatus.RENEWED]: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
}

const REPAIR_COLORS: Record<RepairStatus, string> = {
  [RepairStatus.REPORTED]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  [RepairStatus.REPAIRING]: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  [RepairStatus.SENT_TO_VENDOR]: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  [RepairStatus.REPAIRED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  [RepairStatus.CLOSED]: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

function Pill({ className, children }: { className: string; children: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', className)}>
      {children}
    </span>
  )
}

export function ApprovalStatusPill({ status }: { status: ApprovalStatus }) {
  return <Pill className={APPROVAL_COLORS[status]}>{APPROVAL_STATUS_LABEL[status]}</Pill>
}

export function AssetStatusPill({ status }: { status: AssetStatus }) {
  return <Pill className={ASSET_COLORS[status]}>{ASSET_STATUS_LABEL[status]}</Pill>
}

export function PoStatusPill({ status }: { status: PoStatus }) {
  return <Pill className={PO_COLORS[status]}>{PO_STATUS_LABEL[status]}</Pill>
}

export function WarrantyStatusPill({ status }: { status: WarrantyStatus }) {
  return <Pill className={WARRANTY_COLORS[status]}>{WARRANTY_STATUS_LABEL[status]}</Pill>
}

export function RepairStatusPill({ status }: { status: RepairStatus }) {
  return <Pill className={REPAIR_COLORS[status]}>{REPAIR_STATUS_LABEL[status]}</Pill>
}
