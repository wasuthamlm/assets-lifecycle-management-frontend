import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { notificationsService } from '@/api/services/notifications.service'
import { ENDPOINTS } from '@/api/endpoints'
import { playNotificationSound } from '@/lib/notificationSound'
import type { AppNotification } from '@/api/types/notification.types'

// เป็น fallback เผื่อ SSE (useNotificationsStream) หลุด/ต่อไม่ติดชั่วคราว — ปกติ badge จะอัปเดตจาก
// event ที่ stream ยิงมาก่อนรอบ poll ถึงอยู่แล้ว
const POLL_INTERVAL_MS = 30_000

export function useUnreadCountQuery() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.unreadCount(),
    enabled: !!accessToken,
    refetchInterval: POLL_INTERVAL_MS,
  })
}

export function useNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsService.list(),
    enabled,
  })
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// query ที่ต้อง refetch เมื่อ backend ยิง LiveChange มา (SSE event ชื่อ "change") — ต้องตรงกับ topic ใน
// NotificationsService.publishChange ฝั่ง backend
const LIVE_CHANGE_QUERY_KEYS: Record<string, string[][]> = {
  support_ticket: [['support-tickets']],
  repair: [['repairs'], ['assets']],
}

// เปิด SSE connection ไปยัง /notifications/stream ให้ badge/รายการแจ้งเตือนอัปเดตทันทีที่มีของใหม่
// โดยไม่ต้องรอ poll — mount ที่ AppLayout (อยู่ตลอดช่วงที่ login อยู่ ปิดเองตอน logout/token หาย)
export function useNotificationsStream() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!accessToken) return

    // native EventSource ตั้ง header เองไม่ได้ ต้องส่ง token ผ่าน query param แทน
    // (backend: JwtStrategy รองรับอ่าน token จาก query param นี้โดยเฉพาะ)
    const url = `${import.meta.env.VITE_API_BASE_URL}${ENDPOINTS.notifications.stream}?access_token=${encodeURIComponent(accessToken)}`
    const source = new EventSource(url)
    let hasConnectedBefore = false

    function invalidateLiveTopics() {
      Object.values(LIVE_CHANGE_QUERY_KEYS)
        .flat()
        .forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    }

    // EventSource ต่อใหม่เองเมื่อหลุด แต่ event ที่เกิดระหว่างหลุดหายไปแล้ว (server ไม่ได้เก็บไว้ส่งซ้ำ)
    // → พอต่อติดอีกรอบให้ refetch ทุกอย่างที่ live อยู่ ไม่งั้นหน้าจอค้างข้อมูลเก่าจนกว่าจะมี event ถัดไป
    source.onopen = () => {
      if (hasConnectedBefore) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        invalidateLiveTopics()
      }
      hasConnectedBefore = true
    }

    // ข้อมูลเปลี่ยนแต่ไม่ใช่แจ้งเตือนของเรา (เช่น IT อีกคนรับงาน ticket) — refetch เงียบๆ ไม่มี toast/เสียง
    source.addEventListener('change', (event) => {
      try {
        const { topic } = JSON.parse((event as MessageEvent<string>).data) as { topic: string }
        LIVE_CHANGE_QUERY_KEYS[topic]?.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      } catch {
        // payload แปลก ๆ ก็ข้ามไป
      }
    })

    source.onmessage = (event) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      try {
        const notification = JSON.parse(event.data) as AppNotification
        toast.info(notification.title, { description: notification.message })
        if (!useUiStore.getState().notificationSoundMuted) playNotificationSound()

        // permissions_updated = admin เพิ่งกำหนด role ให้เรา — refetch /auth/me ทันทีแทนที่จะรอ user
        // กด refresh เอง (ดู PendingPermissionsPlaceholder)
        if (notification.type === 'permissions_updated') {
          queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        }

        // employee_profile_completed = มีคนกรอกโปรไฟล์ตัวเองเสร็จ — รายการ users/employees ฝั่ง admin
        // ต้องเห็น record ใหม่แบบ realtime โดยไม่ต้อง refresh หน้าเอง
        if (notification.type === 'employee_profile_completed') {
          queryClient.invalidateQueries({ queryKey: ['users'] })
          queryClient.invalidateQueries({ queryKey: ['employees'] })
        }

        // ตาราง/หน้ารายละเอียดที่เปิดค้างอยู่ต้องเห็นของใหม่ทันทีที่แจ้งเตือนเด้ง ไม่ใช่แค่ badge —
        // เช่น IT Admin เปิดหน้าใบขอค้างไว้ แล้วมีใบใหม่รออนุมัติเข้ามา
        if (notification.type.startsWith('requisition_')) {
          queryClient.invalidateQueries({ queryKey: ['requisitions'] })
          queryClient.invalidateQueries({ queryKey: ['assignments'] })
          queryClient.invalidateQueries({ queryKey: ['assets'] })
        }
        if (notification.type.startsWith('assignment_')) {
          queryClient.invalidateQueries({ queryKey: ['assignments'] })
          queryClient.invalidateQueries({ queryKey: ['assets'] })
        }
        if (notification.type.startsWith('ticket_')) {
          queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
        }
        if (notification.type.startsWith('repair_')) {
          queryClient.invalidateQueries({ queryKey: ['repairs'] })
          queryClient.invalidateQueries({ queryKey: ['assets'] })
        }
        if (notification.type === 'warranty_expiring') {
          queryClient.invalidateQueries({ queryKey: ['warranties'] })
        }
      } catch {
        // payload แปลก ๆ ก็ไม่ต้องทำอะไรต่อ — invalidate ไปแล้วด้านบน badge ก็จะอัปเดตถูกอยู่ดี
      }
    }

    // EventSource reconnect เองอัตโนมัติเมื่อหลุด ไม่ต้อง handle retry เอง (catch-up อยู่ใน onopen ด้านบน)
    return () => source.close()
  }, [accessToken, queryClient])
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDismissMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsService.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDismissAllMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsService.dismissAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
