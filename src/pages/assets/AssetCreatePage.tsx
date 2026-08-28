import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateAssetMutation } from '@/hooks/useAssets'
import { AssetForm } from '@/components/assets/AssetForm'
import { BackLink } from '@/components/ui/BackLink'
import { getErrorMessage } from '@/lib/errorMessage'

export function AssetCreatePage() {
  usePageTitle('เพิ่มทรัพย์สินใหม่')
  const navigate = useNavigate()
  const create = useCreateAssetMutation()

  return (
    <div>
      <BackLink />
      <AssetForm
        submitLabel="บันทึก"
        submitPendingLabel="กำลังบันทึก..."
        isSubmitting={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (asset) => {
              toast.success('เพิ่มทรัพย์สินใหม่เรียบร้อยแล้ว')
              navigate(`/assets/${asset.assetId}`)
            },
            onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
          })
        }
      />
    </div>
  )
}
