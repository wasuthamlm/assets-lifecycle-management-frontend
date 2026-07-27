import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

// แทนที่ Card แบบ box-in-box ในหน้ารายละเอียด — เป็น section เดียวกันคั่นด้วยเส้นบาง
// ไม่ใช้เงา/มุมโค้งซ้อนกันหลายชั้นเหมือนเดิม
export function Section({ title, action, children, className }: SectionProps) {
  return (
    <div className={cn('border-t border-slate-100 pt-6 first:border-t-0 first:pt-0 dark:border-slate-800', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function DetailSheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900', className)}>
      {children}
    </div>
  )
}
