import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'danger',
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} overlay="dim">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle size={18} />
            </div>
          )}
          <p className="pt-1.5 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'กำลังดำเนินการ...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
