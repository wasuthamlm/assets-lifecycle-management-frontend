import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Paginated, RequestType } from '../types/common.types'
import type { Attachment } from '../types/attachment.types'
import type {
  ApproveRequisitionDto,
  CreateRequisitionDto,
  QueryRequisitionDto,
  Requisition,
} from '../types/requisition.types'

export const requisitionsService = {
  async list(query: QueryRequisitionDto = {}): Promise<Paginated<Requisition>> {
    const { data } = await apiClient.get<Paginated<Requisition>>(ENDPOINTS.requisitions.base, { params: query })
    return data
  },
  async mine(query: QueryRequisitionDto = {}): Promise<Paginated<Requisition>> {
    const { data } = await apiClient.get<Paginated<Requisition>>(ENDPOINTS.requisitions.mine, { params: query })
    return data
  },
  async get(id: number): Promise<Requisition> {
    const { data } = await apiClient.get<Requisition>(ENDPOINTS.requisitions.byId(id))
    return data
  },
  async create(dto: CreateRequisitionDto): Promise<Requisition> {
    const { data } = await apiClient.post<Requisition>(ENDPOINTS.requisitions.base, dto)
    return data
  },
  async approve(id: number, dto: ApproveRequisitionDto): Promise<Requisition> {
    const { data } = await apiClient.post<Requisition>(ENDPOINTS.requisitions.approve(id), dto)
    return data
  },
  async nextNo(requestType: RequestType): Promise<string> {
    const { data } = await apiClient.get<{ requisitionNo: string }>(ENDPOINTS.requisitions.nextNo, {
      params: { requestType },
    })
    return data.requisitionNo
  },
  // สโคปเฉพาะเจ้าของใบขอ (หรือคนมี requisition.view_all) — backend เช็ค ownership ให้แล้ว
  // ไม่ใช่ endpoint /attachments ทั่วไปที่คุมด้วย permission attachment.view/manage
  async listAttachments(requisitionId: number): Promise<Attachment[]> {
    const { data } = await apiClient.get<Attachment[]>(ENDPOINTS.requisitions.attachments(requisitionId))
    return data
  },
  async uploadAttachment(
    requisitionId: number,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<Attachment>(ENDPOINTS.requisitions.attachments(requisitionId), form, {
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)
        : undefined,
    })
    return data
  },
  async removeAttachment(requisitionId: number, attachmentId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.requisitions.attachmentById(requisitionId, attachmentId))
  },
}
