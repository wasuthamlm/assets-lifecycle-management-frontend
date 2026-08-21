export type AttachmentReferenceType =
  | 'asset'
  | 'requisition'
  | 'repair'
  | 'goods_receipt'
  | 'disposal'
  | 'warranty'
  | 'purchase_order'

export interface Attachment {
  attachmentId: number
  referenceType: AttachmentReferenceType
  referenceId: number
  fileName: string
  fileUrl: string
  mimeType: string | null
  fileSizeBytes: number | null
  uploadedBy: number | null
  createdAt: string
}
