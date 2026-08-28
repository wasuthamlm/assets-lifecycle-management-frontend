import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { AppNotification } from '../types/notification.types'

export const notificationsService = {
  async list(unreadOnly = false): Promise<AppNotification[]> {
    const { data } = await apiClient.get<AppNotification[]>(ENDPOINTS.notifications.base, {
      params: unreadOnly ? { unreadOnly: true } : undefined,
    })
    return data
  },
  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get<{ count: number }>(ENDPOINTS.notifications.unreadCount)
    return data.count
  },
  async markRead(id: number): Promise<void> {
    await apiClient.post(ENDPOINTS.notifications.markRead(id))
  },
  async markAllRead(): Promise<void> {
    await apiClient.post(ENDPOINTS.notifications.markAllRead)
  },
  async dismiss(id: number): Promise<void> {
    await apiClient.post(ENDPOINTS.notifications.dismiss(id))
  },
  async dismissAll(): Promise<void> {
    await apiClient.post(ENDPOINTS.notifications.dismissAll)
  },
}
