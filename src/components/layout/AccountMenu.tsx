import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, KeyRound, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useLogoutFlow } from '@/hooks/useLogoutFlow'
import { usePermission } from '@/hooks/usePermission'
import { translateRoleName } from '@/lib/roleLabels'

export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const { hasPermission } = usePermission()
  const { handleLogout, modal } = useLogoutFlow()

  const displayName = user?.employee?.fullName ?? user?.fullName ?? user?.username ?? '...'
  const initial = displayName.charAt(0).toUpperCase()
  const roleLabel = user?.roles?.map(translateRoleName).join(' · ')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="บัญชีผู้ใช้"
        className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-2 transition-colors duration-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">
          {displayName}
        </span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card-hover dark:border-slate-800 dark:bg-slate-900">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{displayName}</p>
            {roleLabel && <p className="truncate text-xs text-slate-400">{roleLabel}</p>}
          </div>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <Link
            to="/change-password"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <KeyRound size={15} />
            เปลี่ยนรหัสผ่าน
          </Link>

          {hasPermission('master.manage') && (
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Settings size={15} />
              ตั้งค่าระบบ
            </Link>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              handleLogout()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut size={15} />
            ออกจากระบบ
          </button>
        </div>
      )}
      {modal}
    </div>
  )
}
