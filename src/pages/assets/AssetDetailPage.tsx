import { useParams, useNavigate } from 'react-router-dom'
import { useAssetQuery } from '@/hooks/useAssets'
import { useWarrantiesByAssetQuery } from '@/hooks/useWarranty'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DetailSheet } from '@/components/ui/Section'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { AssetStatusPill } from '@/components/ui/StatusPill'
import { formatCurrency, formatThaiDate } from '@/lib/formatters'
import { WarrantyStatus } from '@/api/types/common.types'

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const assetId = Number(id)
  usePageTitle(`ทรัพย์สิน #${id}`)
  const navigate = useNavigate()
  const { data: asset, isLoading } = useAssetQuery(assetId)
  const { data: warranties = [] } = useWarrantiesByAssetQuery(assetId)

  if (isLoading || !asset) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const renewableWarranty = warranties.find((w) => w.status !== WarrantyStatus.RENEWED)

  return (
    <div>
      <BackLink />
      <DetailSheet>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{asset.assetNo}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{asset.assetName}</p>
          </div>
          {asset.currentStatus && <AssetStatusPill status={asset.currentStatus} />}
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">หมวดหมู่</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.category?.categoryName ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Serial Number</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.serialNumber ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">ยี่ห้อ/รุ่น</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.brandModel ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">ผู้ขาย</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.vendor?.vendorName ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">วันที่ซื้อ</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.purchaseDate ? formatThaiDate(asset.purchaseDate) : '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-400">มูลค่า</dt>
            <dd className="text-slate-700 dark:text-slate-200">
              {asset.purchaseCost != null ? `${formatCurrency(asset.purchaseCost)} บาท` : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">วันหมดประกัน</dt>
            <dd className="text-slate-700 dark:text-slate-200">
              {asset.warrantyExpireDate ? formatThaiDate(asset.warrantyExpireDate) : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">สถานที่ปัจจุบัน</dt>
            <dd className="text-slate-700 dark:text-slate-200">{asset.currentLocation?.locationName ?? '-'}</dd>
          </div>
          {asset.notes && (
            <div className="col-span-2">
              <dt className="text-slate-400">หมายเหตุ</dt>
              <dd className="text-slate-700 dark:text-slate-200">{asset.notes}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4">
          {renewableWarranty ? (
            <Button variant="secondary" onClick={() => navigate(`/warranty/${renewableWarranty.warrantyId}`)}>
              ต่ออายุประกัน
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate(`/warranty?assetId=${asset.assetId}`)}>
              เพิ่ม/ดูข้อมูลประกัน
            </Button>
          )}
        </div>
      </DetailSheet>
    </div>
  )
}
