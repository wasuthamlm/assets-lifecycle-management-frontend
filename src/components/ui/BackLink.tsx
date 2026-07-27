import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function BackLink() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
    >
      <ChevronLeft size={16} />
      ย้อนกลับ
    </button>
  )
}
