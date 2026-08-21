import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <AlertTriangle size={32} strokeWidth={1.5} className="text-amber-500" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          ลองใหม่
        </Button>
      )}
    </div>
  )
}
