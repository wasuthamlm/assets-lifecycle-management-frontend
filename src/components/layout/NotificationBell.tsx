import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
  useUnreadCountQuery,
} from '@/hooks/useNotifications'
import { Spinner } from '@/components/ui/Spinner'
import { formatThaiDate } from '@/lib/formatters'
import type { AppNotification } from '@/api/types/notification.types'

const REFERENCE_ROUTE: Record<string, (id: number) => string> = {
  requisition: (id) => `/requisitions/${id}`,
  warranty: (id) => `/warranty/${id}`,
  assignment: (id) => `/assignments/${id}`,
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: unreadCount = 0 } = useUnreadCountQuery()
  const { data: notifications = [], isLoading } = useNotificationsQuery(open)
  const markRead = useMarkReadMutation()
  const markAllRead = useMarkAllReadMutation()

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
    const buildRoute = n.referenceType ? REFERENCE_ROUTE[n.referenceType] : undefined
    if (buildRoute && n.referenceId) navigate(buildRoute(n.referenceId))
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
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-brand-600 hover:underline"
              >
                อ่านทั้งหมด
              </button>
            )}
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
                <button
                  key={n.notificationId}
                  type="button"
                  onClick={() => handleClickNotification(n)}
                  className="block w-full rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                    <div className={n.isRead ? 'ml-3.5' : ''}>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{formatThaiDate(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
