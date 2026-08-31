import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAssetQuery, useUpdateAssetMutation } from '@/hooks/useAssets'
import { AssetForm, type AssetFormInitial } from '@/components/assets/AssetForm'
import { BackLink } from '@/components/ui/BackLink'
import { Spinner } from '@/components/ui/Spinner'
import { DetailErrorState } from '@/components/ui/DetailErrorState'
import { getErrorMessage } from '@/lib/errorMessage'

export function AssetEditPage() {
  const { id } = useParams<{ id: string }>()
  const assetId = Number(id)
  usePageTitle('แก้ไขทรัพย์สิน')
  const navigate = useNavigate()
  const { data: asset, isLoading, isError, error, refetch } = useAssetQuery(assetId)
  const update = useUpdateAssetMutation(assetId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (isError || !asset) {
    return <DetailErrorState error={error} onRetry={refetch} notFoundMessage="ไม่พบทรัพย์สินนี้" />
  }

  // asset.category ไม่มี parent แปลว่ามันคือหมวดหมู่หลักเอง ไม่ใช่หมวดหมู่ย่อย (ดูคอมเมนต์ที่
  // AssetsListPage: mainCategoryName/subCategoryName ใช้ตรรกะเดียวกัน)
  const initial: AssetFormInitial = {
    assetName: asset.assetName,
    serialNumber: asset.serialNumber,
    brand: asset.brand,
    model: asset.model,
    vendorId: asset.vendorId,
    purchaseDate: asset.purchaseDate,
    purchaseCost: asset.purchaseCost,
    warrantyExpireDate: asset.warrantyExpireDate,
    currentLocationId: asset.currentLocationId,
    notes: asset.notes,
    mainCategoryId: asset.category?.parent?.categoryId ?? asset.category?.categoryId ?? null,
    subCategoryId: asset.category?.parent ? asset.category.categoryId : null,
  }

  return (
    <div>
      <BackLink />
      <AssetForm
        initial={initial}
        submitLabel="บันทึกการแก้ไข"
        submitPendingLabel="กำลังบันทึก..."
        isSubmitting={update.isPending}
        onSubmit={(values) =>
          // imageFile จะเป็น null เสมอที่นี่ — ช่องแนบรูปใน AssetForm แสดงเฉพาะตอนสร้างใหม่ (ไม่มี initial)
          update.mutate(values, {
            onSuccess: () => {
              toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว')
              navigate(`/assets/${assetId}`)
            },
            onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
          })
        }
      />
    </div>
  )
}
