import { Outlet } from 'react-router-dom'
import { FileText } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.10),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(15,23,66,0.10),transparent_45%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(59,130,246,0.08),transparent_45%)]"
      />
      <div className="relative w-full max-w-sm animate-fade-slide-in">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">ระบบทรัพย์สิน IT</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">IT Asset Lifecycle Management</p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
