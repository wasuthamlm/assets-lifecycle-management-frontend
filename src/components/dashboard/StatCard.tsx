import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface StatCardProps {
  label: string
  value: string
  caption?: string
  icon: LucideIcon
}

export function StatCard({ label, value, caption, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <Icon size={18} className="text-brand-500" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      {caption && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{caption}</p>}
    </Card>
  )
}
