import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Paginated } from '../types/common.types'
import type { Attachment } from '../types/attachment.types'
import type {
  CreateTicketDto,
  EscalateToRepairDto,
  QueryTicketDto,
  SupportTicket,
  UpdateTicketStatusDto,
} from '../types/support-ticket.types'

export const supportTicketsService = {
  async list(query: QueryTicketDto = {}): Promise<Paginated<SupportTicket>> {
    const { data } = await apiClient.get<Paginated<SupportTicket>>(ENDPOINTS.supportTickets.base, { params: query })
    return data
  },
  async mine(query: QueryTicketDto = {}): Promise<Paginated<SupportTicket>> {
    const { data } = await apiClient.get<Paginated<SupportTicket>>(ENDPOINTS.supportTickets.mine, { params: query })
    return data
  },
  async get(id: number): Promise<SupportTicket> {
    const { data } = await apiClient.get<SupportTicket>(ENDPOINTS.supportTickets.byId(id))
    return data
  },
  async create(dto: CreateTicketDto): Promise<SupportTicket> {
    const { data } = await apiClient.post<SupportTicket>(ENDPOINTS.supportTickets.base, dto)
    return data
  },
  async updateStatus(id: number, dto: UpdateTicketStatusDto): Promise<SupportTicket> {
    const { data } = await apiClient.patch<SupportTicket>(ENDPOINTS.supportTickets.status(id), dto)
    return data
  },
  async escalateToRepair(id: number, dto: EscalateToRepairDto): Promise<SupportTicket> {
    const { data } = await apiClient.post<SupportTicket>(ENDPOINTS.supportTickets.escalate(id), dto)
    return data
  },
  // สโคปเฉพาะเจ้าของ ticket (หรือ ticket.view_all ดูได้ / ticket.manage แนบ-ลบได้) — backend เช็คให้แล้ว
  async listAttachments(id: number): Promise<Attachment[]> {
    const { data } = await apiClient.get<Attachment[]>(ENDPOINTS.supportTickets.attachments(id))
    return data
  },
  async uploadAttachment(id: number, file: File, onProgress?: (percent: number) => void): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<Attachment>(ENDPOINTS.supportTickets.attachments(id), form, {
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)
        : undefined,
    })
    return data
  },
  async removeAttachment(id: number, attachmentId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.supportTickets.attachmentById(id, attachmentId))
  },
}
