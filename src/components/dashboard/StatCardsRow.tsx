import { FileText, Clock, CheckCircle2, Wallet } from 'lucide-react'
import { StatCard } from './StatCard'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import type { DashboardSummary } from '@/api/types/dashboard.types'

export function StatCardsRow({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="ทรัพย์สินทั้งหมด" value={formatNumber(summary.totalAssets)} caption="ทั้งระบบ" icon={FileText} />
      <StatCard
        label="รอดำเนินการ"
        value={formatNumber(summary.requisitions.pending)}
        caption="ทั้งระบบ · กดเพื่อดูรายการอนุมัติ"
        icon={Clock}
      />
      <StatCard
        label="อนุมัติแล้ว"
        value={formatNumber(summary.requisitions.approved)}
        caption="ทั้งระบบ"
        icon={CheckCircle2}
      />
      <StatCard label="มูลค่ารวม" value={`${formatCurrency(summary.totalAssetValue)} บาท`} icon={Wallet} />
    </div>
  )
}
