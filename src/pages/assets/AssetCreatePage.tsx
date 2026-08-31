import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCreateAssetMutation } from '@/hooks/useAssets'
import { AssetForm } from '@/components/assets/AssetForm'
import { BackLink } from '@/components/ui/BackLink'
import { getErrorMessage } from '@/lib/errorMessage'
import { attachmentsService } from '@/api/services/attachments.service'

export function AssetCreatePage() {
  usePageTitle('เพิ่มทรัพย์สินใหม่')
  const navigate = useNavigate()
  const create = useCreateAssetMutation()
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  return (
    <div>
      <BackLink />
      <AssetForm
        submitLabel="บันทึก"
        submitPendingLabel="กำลังบันทึก..."
        isSubmitting={create.isPending || isUploadingImage}
        onSubmit={(values, imageFiles) =>
          create.mutate(values, {
            onSuccess: async (asset) => {
              toast.success('เพิ่มทรัพย์สินใหม่เรียบร้อยแล้ว')
              // ต้องมี assetId จริงก่อนถึงจะแนบไฟล์ได้ (endpoint แนบไฟล์ต้องระบุ referenceId ของที่มีอยู่แล้ว)
              // อัปโหลดรูปแยกทีหลังสร้างสำเร็จ — ถ้าบางไฟล์อัปโหลดพังไม่ถือว่าทั้งฟอร์มพัง เพราะทรัพย์สินถูกสร้างแล้วจริง
              // แค่แจ้งเตือนแล้วให้ไปแนบใหม่ที่หน้ารายละเอียดแทน (มี AttachmentsPanel อยู่แล้ว) — อัปโหลดพร้อมกันทุกไฟล์
              // (ไม่ต้องเรียงคิวทีละไฟล์เหมือน AttachmentGrid เพราะจำนวนรูปตอนสร้างทรัพย์สินใหม่ไม่เยอะ)
              if (imageFiles.length > 0) {
                setIsUploadingImage(true)
                const results = await Promise.allSettled(
                  imageFiles.map((file) => attachmentsService.upload(file, 'asset', asset.assetId)),
                )
                setIsUploadingImage(false)
                const failed = results.filter((r) => r.status === 'rejected').length
                if (failed > 0) {
                  toast.error(`อัปโหลดรูปไม่สำเร็จ ${failed}/${imageFiles.length} ไฟล์ — แนบใหม่ได้ที่หน้ารายละเอียด`)
                }
              }
              navigate(`/assets/${asset.assetId}`)
            },
            onError: (error) => toast.error(getErrorMessage(error, 'บันทึกไม่สำเร็จ')),
          })
        }
      />
    </div>
  )
}
