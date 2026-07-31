import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** 'center' (default) = fade + slide up in the middle of the screen. 'drawer' = slide-in panel from the right edge. */
  variant?: 'center' | 'drawer'
  /** 'dim' (default) = darken the page behind the modal. 'none' = keep the page fully visible, just float the panel on top. */
  overlay?: 'dim' | 'none'
}

const EXIT_DURATION_MS = 150

export function Modal({ open, onClose, title, children, variant = 'center', overlay = 'dim' }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(open)
  const isDrawer = variant === 'drawer'

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      return
    }
    const timeout = setTimeout(() => setShouldRender(false), EXIT_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [open])

  if (!shouldRender) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        overlay === 'dim' && 'bg-slate-900/40 backdrop-blur-sm',
        isDrawer ? 'justify-end' : 'items-center justify-center p-4',
        open ? 'animate-fade-in' : 'animate-fade-out',
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900',
          isDrawer ? 'h-full rounded-l-2xl' : 'max-h-[85vh] rounded-2xl',
          open ? (isDrawer ? 'animate-drawer-in' : 'animate-sheet-in') : isDrawer ? 'animate-drawer-out' : 'animate-sheet-out',
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
