import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatNumber } from '@/lib/formatters'

interface StatCardProps {
  label: string
  value: number
  format?: (value: number) => string
  caption?: string
  icon: LucideIcon
}

const COUNT_UP_DURATION_MS = 700

export function StatCard({ label, value, format = formatNumber, caption, icon: Icon }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (reducedMotion.current) {
      setDisplayValue(value)
      return
    }
    let frame: number
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / COUNT_UP_DURATION_MS)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(progress >= 1 ? value : value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-800 dark:text-slate-100">{format(displayValue)}</p>
      {caption && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{caption}</p>}
    </Card>
  )
}
