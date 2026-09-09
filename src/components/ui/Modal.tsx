import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  /** 'md' (default, 28rem) = ฟอร์มทั่วไป. 'xl' (~850px) = เนื้อหาที่กว้างกว่า เช่น เอกสารตัวอย่างขนาด A4 */
  size?: 'md' | 'xl'
}

const EXIT_DURATION_MS = 150
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, children, variant = 'center', overlay = 'dim', size = 'md' }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(open)
  const isDrawer = variant === 'drawer'
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      return
    }
    const timeout = setTimeout(() => setShouldRender(false), EXIT_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [open])

  // Escape-to-close, Tab focus trap, body scroll lock, and focus restore on close.
  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstFocusable ?? panel)?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!shouldRender) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        overlay === 'dim' && 'bg-slate-900/40 backdrop-blur-sm',
        isDrawer ? 'justify-end' : 'items-center justify-center p-4',
        open ? 'animate-fade-in' : 'animate-fade-out',
      )}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'flex w-full flex-col bg-white shadow-2xl outline-none dark:bg-slate-900',
          isDrawer ? 'h-full rounded-l-2xl' : 'max-h-[85vh] rounded-2xl',
          !isDrawer && (size === 'xl' ? 'max-w-[min(850px,90vw)]' : 'max-w-md'),
          open ? (isDrawer ? 'animate-drawer-in' : 'animate-sheet-in') : isDrawer ? 'animate-drawer-out' : 'animate-sheet-out',
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 id={titleId} className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
