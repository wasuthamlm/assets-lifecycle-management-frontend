import { AppWindow, Cable, HelpCircle, KeyRound, Laptop, Wifi, type LucideIcon } from 'lucide-react'
import { TicketCategory, TicketStatus } from '@/api/types/common.types'

export const TICKET_CATEGORY_ICON: Record<TicketCategory, LucideIcon> = {
  [TicketCategory.HARDWARE]: Laptop,
  [TicketCategory.ACCESSORY]: Cable,
  [TicketCategory.SOFTWARE]: AppWindow,
  [TicketCategory.NETWORK]: Wifi,
  [TicketCategory.ACCOUNT]: KeyRound,
  [TicketCategory.OTHER]: HelpCircle,
}

/** ต้องตรงกับ TICKET_STATUS_TRANSITIONS ใน support-tickets.service.ts ฝั่ง backend — ใช้ซ่อนปุ่มที่กดแล้วจะโดน 400 */
export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.CANCELLED]: [],
}

export const ACTIVE_TICKET_STATUSES = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS]

/** "อาคาร A · ชั้น 3 ห้องบัญชี" — ใช้แสดงสถานที่ของ ticket ให้เหมือนกันทุกหน้า */
export function formatTicketLocation(t: { location?: { locationName: string } | null; locationDetail: string }): string {
  return [t.location?.locationName, t.locationDetail].filter(Boolean).join(' · ')
}
