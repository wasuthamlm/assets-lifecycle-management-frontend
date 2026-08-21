import { useState } from 'react'
import { toast } from 'sonner'
import { useAttachmentsQuery, useDeleteAttachmentMutation, useUploadAttachmentMutation } from '@/hooks/useAttachments'
import { usePermission } from '@/hooks/usePermission'
import { getErrorMessage } from '@/lib/errorMessage'
import { AttachmentGrid } from './AttachmentGrid'
import type { AttachmentReferenceType } from '@/api/types/attachment.types'

interface AttachmentsPanelProps {
  referenceType: AttachmentReferenceType
  referenceId: number
  title?: string
}

export function AttachmentsPanel({ referenceType, referenceId, title }: AttachmentsPanelProps) {
  const { hasPermission } = usePermission()
  const canView = hasPermission('attachment.view')
  const canManage = hasPermission('attachment.manage')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const { data: attachments = [], isLoading } = useAttachmentsQuery(referenceType, referenceId, canView)
  const upload = useUploadAttachmentMutation(referenceType, referenceId)
  const remove = useDeleteAttachmentMutation(referenceType, referenceId)

  // ไม่มีสิทธิ์ดูไฟล์แนบเลย — ไม่ต้อง render section นี้ (กัน GET /attachments ที่รู้อยู่แล้วว่าจะ 403)
  if (!canView) return null

  function handleUpload(file: File) {
    setUploadProgress(0)
    upload.mutate(
      { file, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          toast.success('อัปโหลดไฟล์สำเร็จ')
          setUploadProgress(null)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'อัปโหลดไฟล์ไม่สำเร็จ'))
          setUploadProgress(null)
        },
      },
    )
  }

  function handleDelete(id: number) {
    remove.mutate(id, {
      onSuccess: () => toast.success('ลบไฟล์แนบแล้ว'),
      onError: () => toast.error('ลบไฟล์ไม่สำเร็จ'),
    })
  }

  return (
    <AttachmentGrid
      title={title}
      attachments={attachments}
      isLoading={isLoading}
      canManage={canManage}
      isUploading={upload.isPending}
      uploadProgress={uploadProgress}
      onUpload={handleUpload}
      onDelete={handleDelete}
    />
  )
}
