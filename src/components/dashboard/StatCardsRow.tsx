import { FileText, Clock, CheckCircle2, Wallet } from 'lucide-react'
import { StatCard } from './StatCard'
import { formatCurrency } from '@/lib/formatters'
import type { DashboardSummary } from '@/api/types/dashboard.types'

const STAGGER_STEP_MS = 60

export function StatCardsRow({ summary }: { summary: DashboardSummary }) {
  const cards = [
    { label: 'ทรัพย์สินทั้งหมด', value: summary.totalAssets, caption: 'ทั้งระบบ', icon: FileText },
    {
      label: 'รอดำเนินการ',
      value: summary.requisitions.pending,
      caption: 'ทั้งระบบ · กดเพื่อดูรายการอนุมัติ',
      icon: Clock,
    },
    { label: 'อนุมัติแล้ว', value: summary.requisitions.approved, caption: 'ทั้งระบบ', icon: CheckCircle2 },
    {
      label: 'มูลค่ารวม',
      value: summary.totalAssetValue,
      format: (v: number) => `${formatCurrency(v)} บาท`,
      icon: Wallet,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <div key={card.label} className="animate-fade-slide-in" style={{ animationDelay: `${i * STAGGER_STEP_MS}ms` }}>
          <StatCard {...card} />
        </div>
      ))}
    </div>
  )
}
