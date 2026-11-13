import { MessageCircle } from 'lucide-react'
import { TicketSource } from '@/api/types/common.types'
import { cn } from '@/lib/utils'

/** ป้าย "LINE" สำหรับ ticket ที่แจ้งผ่าน LINE OA — ticket จากเว็บไม่แสดงอะไร (เป็นค่าปกติ ไม่ต้องรก) */
export function TicketSourceBadge({ source, className }: { source: TicketSource | undefined; className?: string }) {
  if (source !== TicketSource.LINE) return null
  return (
    <span
      title="แจ้งผ่าน LINE"
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#06C755]/10 px-2 py-0.5 text-xs font-medium text-[#05a347] dark:bg-[#06C755]/15 dark:text-[#3ddc84]',
        className,
      )}
    >
      <MessageCircle size={12} aria-hidden /> LINE
    </span>
  )
}
