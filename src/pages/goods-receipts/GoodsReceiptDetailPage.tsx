import { useParams } from 'react-router-dom'
import { useGoodsReceiptQuery } from '@/hooks/useGoodsReceipts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DetailSheet, Section } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { AttachmentsPanel } from '@/components/attachments/AttachmentsPanel'
import { formatThaiDate } from '@/lib/formatters'

export function GoodsReceiptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const receiptId = Number(id)
  usePageTitle(`ใบรับของ #${id}`)
  const { data: receipt, isLoading, isError, error, refetch } = useGoodsReceiptQuery(receiptId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !receipt) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบใบรับของนี้" />
  }

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <Section>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{receipt.receiptNo}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            อ้างอิงใบสั่งซื้อ: {receipt.purchaseOrder?.poNo ?? '-'}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">วันที่รับของ</dt>
              <dd className="text-slate-700 dark:text-slate-200">
                {receipt.receiptDate ? formatThaiDate(receipt.receiptDate) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">สถานที่รับเข้า</dt>
              <dd className="text-slate-700 dark:text-slate-200">{receipt.location?.locationName ?? '-'}</dd>
            </div>
            {receipt.notes && (
              <div className="col-span-2">
                <dt className="text-slate-400">หมายเหตุ</dt>
                <dd className="text-slate-700 dark:text-slate-200">{receipt.notes}</dd>
              </div>
            )}
          </dl>
        </Section>

        <Section title="รายการที่รับเข้า">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {receipt.items.map((item) => (
              <div key={item.receiptItemId} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  {item.asset
                    ? `${item.asset.assetNo} — ${item.asset.assetName}`
                    : item.stockItem
                      ? `${item.stockItem.itemName} x${item.receivedQuantity ?? 0}`
                      : '-'}
                </span>
                {item.conditionOnReceipt && <span className="text-slate-400">{item.conditionOnReceipt}</span>}
              </div>
            ))}
          </div>
        </Section>

        <AttachmentsPanel referenceType="goods_receipt" referenceId={receipt.receiptId} />
      </DetailSheet>
    </div>
  )
}
