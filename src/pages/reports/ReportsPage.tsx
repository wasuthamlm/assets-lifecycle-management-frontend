import { FileText, Wallet, ShoppingCart, Clock } from 'lucide-react'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { useAssetsQuery } from '@/hooks/useAssets'
import { usePurchaseOrdersQuery } from '@/hooks/usePurchaseOrders'
import { usePageTitle } from '@/hooks/usePageTitle'
import { StatCard } from '@/components/dashboard/StatCard'
import { RequisitionByPersonCard } from '@/components/dashboard/RequisitionByPersonCard'
import { Spinner } from '@/components/ui/Spinner'
import { BreakdownCard } from './BreakdownCard'
import { ASSET_STATUS_LABEL, PO_STATUS_LABEL } from '@/lib/constants'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import type { AssetStatus, PoStatus } from '@/api/types/common.types'

export function ReportsPage() {
  usePageTitle('รายงาน')
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary()
  const { data: assetsPage, isLoading: assetsLoading } = useAssetsQuery({ limit: 500 })
  const { data: purchaseOrders = [], isLoading: poLoading } = usePurchaseOrdersQuery()

  if (summaryLoading || assetsLoading || poLoading || !summary) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const assets = assetsPage?.data ?? []

  const assetsByStatus = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => {
      const key = a.currentStatus ?? 'UNKNOWN'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {}),
  ).map(([status, count]) => ({
    key: status,
    label: status === 'UNKNOWN' ? 'ไม่ระบุ' : ASSET_STATUS_LABEL[status as AssetStatus],
    count,
  }))

  const assetsByCategory = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => {
      const key = a.category?.categoryName ?? 'ไม่ระบุหมวดหมู่'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([label, count]) => ({ key: label, label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const posByStatus = Object.entries(
    purchaseOrders.reduce<Record<string, number>>((acc, po) => {
      acc[po.status] = (acc[po.status] ?? 0) + 1
      return acc
    }, {}),
  ).map(([status, count]) => ({
    key: status,
    label: PO_STATUS_LABEL[status as PoStatus],
    count,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="ทรัพย์สินทั้งหมด" value={formatNumber(summary.totalAssets)} icon={FileText} />
        <StatCard label="มูลค่ารวม" value={`${formatCurrency(summary.totalAssetValue)} บาท`} icon={Wallet} />
        <StatCard label="ใบสั่งซื้อทั้งหมด" value={formatNumber(purchaseOrders.length)} icon={ShoppingCart} />
        <StatCard label="รอดำเนินการ" value={formatNumber(summary.requisitions.pending)} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownCard title="ทรัพย์สินตามสถานะ" rows={assetsByStatus} />
        <BreakdownCard title="ทรัพย์สินตามหมวดหมู่ (สูงสุด 8)" rows={assetsByCategory} />
        <BreakdownCard title="ใบสั่งซื้อตามสถานะ" rows={posByStatus} />
        <RequisitionByPersonCard data={summary.requisitions.byPerson} />
      </div>
    </div>
  )
}
