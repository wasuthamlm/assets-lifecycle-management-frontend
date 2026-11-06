import { useState } from 'react'
import { toast } from 'sonner'
import {
  useDeleteSupportTicketAttachmentMutation,
  useSupportTicketAttachmentsQuery,
  useUploadSupportTicketAttachmentMutation,
} from '@/hooks/useSupportTickets'
import { getErrorMessage } from '@/lib/errorMessage'
import { AttachmentGrid } from './AttachmentGrid'

interface TicketAttachmentsPanelProps {
  ticketId: number
  /** เจ้าของ ticket หรือ ticket.manage — hr ดูได้อย่างเดียว (backend บล็อกซ้ำอีกชั้น) */
  canManage: boolean
}

/** เหมือน RequisitionAttachmentsPanel — endpoint /support-tickets/:id/attachments เช็ค ownership ฝั่ง backend เอง */
export function TicketAttachmentsPanel({ ticketId, canManage }: TicketAttachmentsPanelProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const { data: attachments = [], isLoading } = useSupportTicketAttachmentsQuery(ticketId)
  const upload = useUploadSupportTicketAttachmentMutation(ticketId)
  const remove = useDeleteSupportTicketAttachmentMutation(ticketId)

  function handleUpload(file: File) {
    setUploadProgress(0)
    upload.mutate(
      { file, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          toast.success('แนบรูปสำเร็จ')
          setUploadProgress(null)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'แนบรูปไม่สำเร็จ'))
          setUploadProgress(null)
        },
      },
    )
  }

  function handleDelete(id: number) {
    remove.mutate(id, {
      onSuccess: () => toast.success('ลบรูปแล้ว'),
      onError: () => toast.error('ลบรูปไม่สำเร็จ'),
    })
  }

  return (
    <AttachmentGrid
      title="รูปภาพประกอบ"
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
