import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

const EXIT_DURATION_MS = 150

export function Modal({ open, onClose, title, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(open)

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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm ${
        open ? 'animate-fade-in' : 'animate-fade-out'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 ${
          open ? 'animate-scale-in' : 'animate-scale-out'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
