import { cn } from '@/lib/utils'

export interface TimelineStep {
  label: string
  description?: string
  timestamp?: string
  status: 'done' | 'current' | 'pending' | 'rejected'
}

const DOT_CLASSES: Record<TimelineStep['status'], string> = {
  done: 'bg-emerald-500 text-white',
  current: 'bg-brand-500 text-white',
  pending: 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
  rejected: 'bg-red-500 text-white',
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol>
      {steps.map((step, idx) => (
        <li key={idx} className="relative flex gap-3 pb-6 last:pb-0">
          {idx < steps.length - 1 && (
            <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200 dark:bg-slate-700" />
          )}
          <span
            className={cn(
              'relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
              DOT_CLASSES[step.status],
            )}
          >
            {step.status === 'done' ? '✓' : step.status === 'rejected' ? '✕' : ''}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{step.label}</p>
              {step.timestamp && <p className="shrink-0 text-xs text-slate-400">{step.timestamp}</p>}
            </div>
            {step.description && <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
