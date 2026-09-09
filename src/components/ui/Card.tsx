import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Set only when the whole card itself is clickable/navigable — adds the hover lift shadow. Default false: most cards are static containers and shouldn't signal clickability they don't have. */
  interactive?: boolean
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition-shadow duration-200 ease-out dark:border-slate-800/80 dark:bg-slate-900',
        interactive && 'hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  )
}
