import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition-shadow duration-200 ease-out hover:shadow-card-hover dark:border-slate-800/80 dark:bg-slate-900',
        className,
      )}
      {...props}
    />
  )
}
