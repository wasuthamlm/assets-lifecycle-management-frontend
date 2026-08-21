import { useState } from 'react'
import { toast } from 'sonner'
import {
  useDeleteRequisitionAttachmentMutation,
  useRequisitionAttachmentsQuery,
  useUploadRequisitionAttachmentMutation,
} from '@/hooks/useRequisitions'
import { getErrorMessage } from '@/lib/errorMessage'
import { AttachmentGrid } from './AttachmentGrid'

interface RequisitionAttachmentsPanelProps {
  requisitionId: number
}

/**
 * ต่างจาก AttachmentsPanel (generic) ตรงที่ไม่เช็ค permission attachment.view/attachment.manage —
 * endpoint /requisitions/:id/attachments ฝั่ง backend เช็ค ownership เอง (เจ้าของใบขอ หรือคนมี
 * requisition.view_all) ใครเปิดหน้านี้ได้ (ผ่าน findOne ของใบขอ) ก็ดู/แนบ/ลบไฟล์ตรงนี้ได้เลย
 */
export function RequisitionAttachmentsPanel({ requisitionId }: RequisitionAttachmentsPanelProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const { data: attachments = [], isLoading } = useRequisitionAttachmentsQuery(requisitionId)
  const upload = useUploadRequisitionAttachmentMutation(requisitionId)
  const remove = useDeleteRequisitionAttachmentMutation(requisitionId)

  function handleUpload(file: File) {
    setUploadProgress(0)
    upload.mutate(
      { file, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          toast.success('แนบเอกสารสำเร็จ')
          setUploadProgress(null)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'แนบเอกสารไม่สำเร็จ'))
          setUploadProgress(null)
        },
      },
    )
  }

  function handleDelete(id: number) {
    remove.mutate(id, {
      onSuccess: () => toast.success('ลบเอกสารแล้ว'),
      onError: () => toast.error('ลบเอกสารไม่สำเร็จ'),
    })
  }

  return (
    <AttachmentGrid
      title="เอกสาร / รูปภาพประกอบใบขอ"
      attachments={attachments}
      isLoading={isLoading}
      canManage
      isUploading={upload.isPending}
      uploadProgress={uploadProgress}
      onUpload={handleUpload}
      onDelete={handleDelete}
    />
  )
}
