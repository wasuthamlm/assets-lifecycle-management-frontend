import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { applyTheme, useUiStore } from '@/stores/ui.store'

export function SettingsPage() {
  usePageTitle('ตั้งค่า')
  const { data: user, isLoading } = useCurrentUser()
  const logoutMutation = useLogout()
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <User size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {user.employee?.fullName ?? user.username}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.employee?.position ?? user.username}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">ชื่อผู้ใช้</dt>
            <dd className="text-slate-700 dark:text-slate-200">{user.username}</dd>
          </div>
          <div>
            <dt className="text-slate-400">อีเมล</dt>
            <dd className="text-slate-700 dark:text-slate-200">{user.email ?? '-'}</dd>
          </div>
          {user.employee?.employeeCode && (
            <div>
              <dt className="text-slate-400">รหัสพนักงาน</dt>
              <dd className="text-slate-700 dark:text-slate-200">{user.employee.employeeCode}</dd>
            </div>
          )}
          {user.employee?.department && (
            <div>
              <dt className="text-slate-400">แผนก</dt>
              <dd className="text-slate-700 dark:text-slate-200">{user.employee.department.departmentName}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">สิทธิ์การใช้งาน</h3>
        {user.permissions.length === 0 ? (
          <p className="text-sm text-slate-400">ไม่มีสิทธิ์พิเศษ</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((p) => (
              <span
                key={p}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">ธีมสี</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ธีมปัจจุบัน: {theme === 'light' ? 'สว่าง' : 'มืด'}
          </p>
          <Button variant="secondary" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            สลับธีม
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">บัญชี</h3>
        <Button variant="danger" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          <LogOut size={16} />
          ออกจากระบบ
        </Button>
      </Card>
    </div>
  )
}
