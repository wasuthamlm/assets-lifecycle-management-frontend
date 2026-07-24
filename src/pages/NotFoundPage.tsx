import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <p className="text-4xl font-semibold text-slate-300 dark:text-slate-700">404</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">ไม่พบหน้าที่คุณต้องการ</p>
      <Link to="/dashboard">
        <Button variant="secondary" size="sm">
          กลับหน้าแดชบอร์ด
        </Button>
      </Link>
    </div>
  )
}
