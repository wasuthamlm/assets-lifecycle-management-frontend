import axios from 'axios'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { CurrentUser } from '../types/auth.types'
import type { Assignment } from '../types/assignment.types'
import type { Attachment } from '../types/attachment.types'
import type { Paginated } from '../types/common.types'
import type { CreateTicketDto, QueryTicketDto, SupportTicket } from '../types/support-ticket.types'

/**
 * client แยกสำหรับหน้า LIFF — ยืนยันตัวด้วย LINE ID token ไม่ใช่ JWT ของเว็บ
 * จึงไม่ใช้ apiClient (ที่แนบ Bearer token และ redirect ไป /login ตอนเจอ 401)
 */
const liffClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })
const lineHeader = (idToken: string) => ({ headers: { 'X-Line-Id-Token': idToken } })

export interface LineConfig {
  enabled: boolean
  liffId: string | null
  /** แชทบอท (พิมพ์แจ้งปัญหาในแชท OA) เปิดใช้งานอยู่ */
  chatEnabled: boolean
  addFriendUrl: string | null
}

export const lineService = {
  async config(): Promise<LineConfig> {
    const { data } = await liffClient.get<LineConfig>(ENDPOINTS.line.config)
    return data
  },

  // ----- ฝั่งเว็บ (JWT) — ผูก/ยกเลิกผูกบัญชี LINE ของตัวเอง -----
  async linkStatus(): Promise<{ linked: boolean }> {
    const { data } = await apiClient.get<{ linked: boolean }>(ENDPOINTS.line.link)
    return data
  },
  async link(idToken: string): Promise<{ linked: boolean }> {
    const { data } = await apiClient.post<{ linked: boolean }>(ENDPOINTS.line.link, { idToken })
    return data
  },
  /** รหัส 6 หลักสำหรับพิมพ์ในแชท OA เพื่อผูกบัญชี */
  async linkCode(): Promise<{ code: string; expiresAt: string }> {
    const { data } = await apiClient.post<{ code: string; expiresAt: string }>(ENDPOINTS.line.linkCode)
    return data
  },
  async unlink(): Promise<{ linked: boolean }> {
    const { data } = await apiClient.delete<{ linked: boolean }>(ENDPOINTS.line.link)
    return data
  },

  // ----- ฝั่ง LIFF (LINE ID token) -----
  async me(idToken: string): Promise<CurrentUser> {
    const { data } = await liffClient.get<CurrentUser>(ENDPOINTS.line.liff.me, lineHeader(idToken))
    return data
  },
  async myAssignments(idToken: string): Promise<Assignment[]> {
    const { data } = await liffClient.get<Assignment[]>(ENDPOINTS.line.liff.myAssignments, lineHeader(idToken))
    return data
  },
  async createTicket(idToken: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const { data } = await liffClient.post<SupportTicket>(ENDPOINTS.line.liff.tickets, dto, lineHeader(idToken))
    return data
  },
  async myTickets(idToken: string, query: QueryTicketDto = {}): Promise<Paginated<SupportTicket>> {
    const { data } = await liffClient.get<Paginated<SupportTicket>>(ENDPOINTS.line.liff.myTickets, { ...lineHeader(idToken), params: query })
    return data
  },
  async uploadAttachment(idToken: string, ticketId: number, file: File): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await liffClient.post<Attachment>(ENDPOINTS.line.liff.attachments(ticketId), form, lineHeader(idToken))
    return data
  },
}
