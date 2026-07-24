import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  message?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, message = 'ไม่มีข้อมูล', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-slate-400 dark:text-slate-500">
      <Icon size={32} strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
      {action}
    </div>
  )
}
