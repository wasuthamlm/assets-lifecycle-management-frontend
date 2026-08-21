import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Attachment, AttachmentReferenceType } from '../types/attachment.types'

export const attachmentsService = {
  async listByReference(referenceType: AttachmentReferenceType, referenceId: number): Promise<Attachment[]> {
    const { data } = await apiClient.get<Attachment[]>(ENDPOINTS.attachments.base, {
      params: { referenceType, referenceId },
    })
    return data
  },
  async upload(
    file: File,
    referenceType: AttachmentReferenceType,
    referenceId: number,
    onProgress?: (percent: number) => void,
  ): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    form.append('referenceType', referenceType)
    form.append('referenceId', String(referenceId))
    // ไม่ต้องตั้ง Content-Type เอง — axios/browser จะใส่ multipart boundary ให้อัตโนมัติ
    const { data } = await apiClient.post<Attachment>(ENDPOINTS.attachments.upload, form, {
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)
        : undefined,
    })
    return data
  },
  async remove(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.attachments.byId(id))
  },
}
