import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  Children,
  isValidElement,
  type SelectHTMLAttributes,
  type OptionHTMLAttributes,
  type ReactElement,
} from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type OptionProps = OptionHTMLAttributes<HTMLOptionElement>

interface ParsedOption {
  value: string
  label: string
  disabled: boolean
}

function parseOptions(children: React.ReactNode): ParsedOption[] {
  return Children.toArray(children)
    .filter((c): c is ReactElement<OptionProps> => isValidElement(c))
    .map((c) => ({
      value: String(c.props.value ?? ''),
      label: String(c.props.children ?? ''),
      disabled: !!c.props.disabled,
    }))
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, value, onChange, defaultValue, onBlur, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const internalRef = useRef<HTMLSelectElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const isControlled = value !== undefined
    const [uncontrolledValue, setUncontrolledValue] = useState(String(defaultValue ?? ''))
    const displayValue = isControlled ? String(value) : uncontrolledValue

    const options = parseOptions(children)
    const selectedOption = options.find((o) => o.value === displayValue)
    const placeholderOption = options.find((o) => o.value === '')

    // Merge external ref with internal ref
    const mergeRef = useCallback(
      (node: HTMLSelectElement | null) => {
        internalRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node
      },
      [ref],
    )

    // Close on outside click
    useEffect(() => {
      if (!open) return
      const handle = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
          onBlur?.({} as React.FocusEvent<HTMLSelectElement>)
        }
      }
      document.addEventListener('mousedown', handle)
      return () => document.removeEventListener('mousedown', handle)
    }, [open, onBlur])

    function handleSelect(optValue: string) {
      if (!isControlled) {
        setUncontrolledValue(optValue)
        if (internalRef.current) {
          internalRef.current.value = optValue
        }
      }
      setOpen(false)
      onChange?.({
        target: { value: optValue, name: props.name ?? '' },
      } as React.ChangeEvent<HTMLSelectElement>)
      onBlur?.({} as React.FocusEvent<HTMLSelectElement>)
    }

    const isEmpty = !selectedOption || selectedOption.value === ''
    const displayLabel = isEmpty
      ? (placeholderOption?.label ?? 'เลือก...')
      : (selectedOption?.label ?? '')

    // Options shown in dropdown (exclude empty-value placeholder from list)
    const dropdownOptions = options.filter((o) => o.value !== '')

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        {/* Hidden native select — keeps ref for react-hook-form */}
        <select
          ref={mergeRef}
          className="sr-only"
          value={isControlled ? value : undefined}
          defaultValue={!isControlled ? String(defaultValue ?? '') : undefined}
          onChange={onChange}
          tabIndex={-1}
          aria-hidden="true"
          {...props}
        >
          {children}
        </select>

        {/* Custom trigger button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm transition-all duration-200',
            open
              ? 'border-brand-500 ring-2 ring-brand-500/25 dark:ring-brand-500/20'
              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            'dark:bg-slate-900',
          )}
        >
          <span className={cn('truncate', isEmpty ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100')}>
            {displayLabel}
          </span>
          <ChevronDown
            size={15}
            className={cn('shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500', open && 'rotate-180')}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            className={cn(
              'absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-y-auto',
              'rounded-xl border border-slate-100 bg-white py-1 shadow-lg',
              'dark:border-slate-800 dark:bg-slate-900',
              'animate-slide-down',
            )}
          >
            {placeholderOption && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={cn(
                  'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors duration-100',
                  displayValue === ''
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800',
                )}
              >
                <span className="flex-1 italic">{placeholderOption.label}</span>
                {displayValue === '' && <Check size={13} className="shrink-0 text-brand-500" />}
              </button>
            )}

            {placeholderOption && dropdownOptions.length > 0 && (
              <div className="mx-3 my-1 border-t border-slate-100 dark:border-slate-800" />
            )}

            {dropdownOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors duration-100',
                  opt.value === displayValue
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                  opt.disabled && 'cursor-not-allowed opacity-40',
                )}
              >
                <span className="flex-1">{opt.label}</span>
                {opt.value === displayValue && <Check size={13} className="shrink-0 text-brand-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  },
)
Select.displayName = 'Select'
