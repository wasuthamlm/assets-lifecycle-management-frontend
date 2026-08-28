import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Volume2, VolumeX, X } from 'lucide-react'
import {
  useDismissAllMutation,
  useDismissMutation,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
  useUnreadCountQuery,
} from '@/hooks/useNotifications'
import { useUiStore } from '@/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { formatThaiDate } from '@/lib/formatters'
import type { AppNotification } from '@/api/types/notification.types'

// referenceType ต้องครอบทุกค่าที่ NotificationsService.notify() ส่งมาจริง (ดู requisitions/warranty-expiry.cron
// ฝั่ง backend) — ค่าไหนไม่มี mapping ตรงนี้ กดแล้วจะไม่ไปไหนเลยแบบเงียบ ๆ
const REFERENCE_ROUTE: Record<string, (id: number) => string> = {
  requisition: (id) => `/requisitions/${id}`,
  warranty: (id) => `/warranty/${id}`,
  assignment: (id) => `/assignments/${id}`,
}

// employee_profile_completed กับ permissions_updated ใช้ referenceType='employee' เหมือนกัน (ดู
// AuthService.notifyAdminsOfNewEmployeeProfile / RolesPermissionsService.assignRolesToEmployee) แต่คนละ
// audience: อันแรกส่งหา admin (ควรพาไปหน้ารายชื่อพนักงานเพื่อกำหนดสิทธิ์ต่อ — ยังไม่มีหน้ารายละเอียดรายตัว
// ดู router.tsx) ส่วนอันหลังส่งหาตัวพนักงานเอง (พนักงานทั่วไปส่วนมากไม่มีสิทธิ์เข้า /employees จะโดนเด้งออก
// เปล่าประโยชน์) จึงต้องแยกด้วย type ไม่ใช่ referenceType อย่างเดียว
function routeFor(n: AppNotification): string | undefined {
  if (n.type === 'employee_profile_completed') return '/employees'
  const buildRoute = n.referenceType ? REFERENCE_ROUTE[n.referenceType] : undefined
  return buildRoute && n.referenceId ? buildRoute(n.referenceId) : undefined
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: unreadCount = 0 } = useUnreadCountQuery()
  const { data: notifications = [], isLoading } = useNotificationsQuery(open)
  const soundMuted = useUiStore((s) => s.notificationSoundMuted)
  const toggleSound = useUiStore((s) => s.toggleNotificationSound)
  const markRead = useMarkReadMutation()
  const markAllRead = useMarkAllReadMutation()
  const dismiss = useDismissMutation()
  const dismissAll = useDismissAllMutation()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleClickNotification(n: AppNotification) {
    if (!n.isRead) markRead.mutate(n.notificationId)
    setOpen(false)
    const route = routeFor(n)
    if (route) navigate(route)
  }

  // stopPropagation กันไม่ให้ click ทะลุไปโดน handleClickNotification ของปุ่มแม่ (mark read + navigate)
  function handleDismiss(e: React.MouseEvent, notificationId: number) {
    e.stopPropagation()
    dismiss.mutate(notificationId)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-200 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
        aria-label="การแจ้งเตือน"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-100 bg-white p-2 shadow-card-hover dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">การแจ้งเตือน</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSound()}
                title={soundMuted ? 'เปิดเสียงแจ้งเตือน' : 'ปิดเสียงแจ้งเตือน'}
                aria-label={soundMuted ? 'เปิดเสียงแจ้งเตือน' : 'ปิดเสียงแจ้งเตือน'}
                className="rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-brand-600 hover:underline"
                >
                  อ่านทั้งหมด
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => dismissAll.mutate()}
                  className="text-xs text-slate-400 hover:text-slate-600 hover:underline dark:hover:text-slate-300"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-400">ไม่มีการแจ้งเตือน</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleClickNotification(n)}
                  onKeyDown={(e) => e.key === 'Enter' && handleClickNotification(n)}
                  className="group relative flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                  <div className={`flex-1 pr-5 ${n.isRead ? 'ml-3.5' : ''}`}>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{formatThaiDate(n.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDismiss(e, n.notificationId)}
                    aria-label="ลบการแจ้งเตือนนี้"
                    className="absolute right-1.5 top-1.5 rounded-full p-1 text-slate-300 opacity-0 transition-opacity duration-150 hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
