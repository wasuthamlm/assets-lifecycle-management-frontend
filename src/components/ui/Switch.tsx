import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
