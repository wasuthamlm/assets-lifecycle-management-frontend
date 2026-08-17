import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  Children,
  Fragment,
  isValidElement,
  type SelectHTMLAttributes,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type OptionProps = OptionHTMLAttributes<HTMLOptionElement>

interface ParsedOption {
  value: string
  label: string
  disabled: boolean
}

// Children.toArray does not descend into <>...</> Fragments, so options
// nested inside one (e.g. a static <option> alongside a mapped array) would
// otherwise be treated as a single opaque child and stringified as
// "[object Object]". Recurse into Fragments to flatten them first.
function flattenOptionElements(children: ReactNode): ReactElement<OptionProps>[] {
  const result: ReactElement<OptionProps>[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Fragment) {
      result.push(...flattenOptionElements((child.props as { children?: ReactNode }).children))
    } else {
      result.push(child as ReactElement<OptionProps>)
    }
  })
  return result
}

function parseOptions(children: React.ReactNode): ParsedOption[] {
  return flattenOptionElements(children).map((c) => ({
    value: String(c.props.value ?? ''),
    label: String(c.props.children ?? ''),
    disabled: !!c.props.disabled,
  }))
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, value, onChange, defaultValue, onBlur, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const internalRef = useRef<HTMLSelectElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
    const typeaheadRef = useRef<{ query: string; timeout: ReturnType<typeof setTimeout> | null }>({
      query: '',
      timeout: null,
    })
    const listboxId = useId()

    const isControlled = value !== undefined
    const [uncontrolledValue, setUncontrolledValue] = useState(String(defaultValue ?? ''))
    const displayValue = isControlled ? String(value) : uncontrolledValue

    const options = parseOptions(children)
    const selectedOption = options.find((o) => o.value === displayValue)
    const placeholderOption = options.find((o) => o.value === '')

    // Options shown in dropdown (exclude empty-value placeholder from list)
    const dropdownOptions = options.filter((o) => o.value !== '')
    // Flat, in-render-order list used for keyboard navigation
    const navOptions = placeholderOption ? [placeholderOption, ...dropdownOptions] : dropdownOptions

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
          if (internalRef.current) {
            onBlur?.({ target: internalRef.current, currentTarget: internalRef.current } as unknown as React.FocusEvent<HTMLSelectElement>)
          }
        }
      }
      document.addEventListener('mousedown', handle)
      return () => document.removeEventListener('mousedown', handle)
    }, [open, onBlur])

    // Keep the highlighted option scrolled into view as it changes
    useEffect(() => {
      if (!open) return
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }, [open, activeIndex])

    function handleSelect(optValue: string) {
      if (!isControlled) {
        setUncontrolledValue(optValue)
      }
      if (internalRef.current) {
        internalRef.current.value = optValue
      }
      setOpen(false)
      const target = internalRef.current
      if (target) {
        onChange?.({ target, currentTarget: target } as unknown as React.ChangeEvent<HTMLSelectElement>)
        onBlur?.({ target, currentTarget: target } as unknown as React.FocusEvent<HTMLSelectElement>)
      }
    }

    function openDropdown() {
      if (props.disabled) return
      const selectedIdx = navOptions.findIndex((o) => o.value === displayValue)
      const fallbackIdx = navOptions.findIndex((o) => !o.disabled)
      setActiveIndex(selectedIdx >= 0 ? selectedIdx : fallbackIdx)
      setOpen(true)
    }

    function closeDropdown(focusTrigger = false) {
      setOpen(false)
      if (focusTrigger) triggerRef.current?.focus()
    }

    function moveActive(delta: number) {
      if (navOptions.length === 0) return
      setActiveIndex((prev) => {
        let idx = prev < 0 ? 0 : prev
        for (let step = 0; step < navOptions.length; step++) {
          idx = (idx + delta + navOptions.length) % navOptions.length
          if (!navOptions[idx].disabled) return idx
        }
        return prev
      })
    }

    function moveToEdge(edge: 'first' | 'last') {
      const order = edge === 'first' ? navOptions.map((_, i) => i) : navOptions.map((_, i) => i).reverse()
      const found = order.find((i) => !navOptions[i].disabled)
      if (found !== undefined) setActiveIndex(found)
    }

    function selectActive() {
      const opt = navOptions[activeIndex]
      if (!opt || opt.disabled) return
      handleSelect(opt.value)
      triggerRef.current?.focus()
    }

    function typeahead(char: string) {
      const buf = typeaheadRef.current
      if (buf.timeout) clearTimeout(buf.timeout)
      buf.query += char.toLowerCase()
      buf.timeout = setTimeout(() => {
        buf.query = ''
      }, 500)

      const n = navOptions.length
      const startFrom = activeIndex >= 0 ? activeIndex + 1 : 0
      for (let step = 0; step < n; step++) {
        const idx = (startFrom + step) % n
        if (!navOptions[idx].disabled && navOptions[idx].label.toLowerCase().startsWith(buf.query)) {
          setActiveIndex(idx)
          return
        }
      }
    }

    function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      if (props.disabled) return
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault()
          if (!open) openDropdown()
          else moveActive(e.key === 'ArrowDown' ? 1 : -1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (!open) openDropdown()
          else selectActive()
          break
        case 'Escape':
          if (open) {
            e.preventDefault()
            closeDropdown()
          }
          break
        case 'Home':
          if (open) {
            e.preventDefault()
            moveToEdge('first')
          }
          break
        case 'End':
          if (open) {
            e.preventDefault()
            moveToEdge('last')
          }
          break
        case 'Tab':
          if (open) setOpen(false)
          break
        default:
          if (open && e.key.length === 1) {
            e.preventDefault()
            typeahead(e.key)
          }
      }
    }

    const isEmpty = !selectedOption || selectedOption.value === ''
    const displayLabel = isEmpty
      ? (placeholderOption?.label ?? 'เลือก...')
      : (selectedOption?.label ?? '')

    const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined

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
          ref={triggerRef}
          type="button"
          disabled={props.disabled}
          onClick={() => !props.disabled && (open ? closeDropdown() : openDropdown())}
          onKeyDown={handleTriggerKeyDown}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm transition-all duration-200',
            open
              ? 'border-brand-500 ring-2 ring-brand-500/25 dark:ring-brand-500/20'
              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            props.disabled && 'cursor-not-allowed opacity-50',
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
            id={listboxId}
            role="listbox"
            className={cn(
              'absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-y-auto',
              'rounded-xl border border-slate-100 bg-white py-1 shadow-lg',
              'dark:border-slate-800 dark:bg-slate-900',
              'animate-slide-down',
            )}
          >
            {placeholderOption && (
              <button
                id={`${listboxId}-option-0`}
                ref={(el) => {
                  itemRefs.current[0] = el
                }}
                type="button"
                role="option"
                aria-selected={displayValue === ''}
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={() => handleSelect('')}
                className={cn(
                  'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors duration-100',
                  activeIndex === 0
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : displayValue === ''
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

            {dropdownOptions.map((opt, i) => {
              const idx = placeholderOption ? i + 1 : i
              return (
                <button
                  key={opt.value}
                  id={`${listboxId}-option-${idx}`}
                  ref={(el) => {
                    itemRefs.current[idx] = el
                  }}
                  type="button"
                  role="option"
                  aria-selected={opt.value === displayValue}
                  tabIndex={-1}
                  disabled={opt.disabled}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors duration-100',
                    activeIndex === idx
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : opt.value === displayValue
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                    opt.disabled && 'cursor-not-allowed opacity-40',
                  )}
                >
                  <span className="flex-1">{opt.label}</span>
                  {opt.value === displayValue && <Check size={13} className="shrink-0 text-brand-500" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  },
)
Select.displayName = 'Select'
