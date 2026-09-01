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
import { ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type OptionProps = OptionHTMLAttributes<HTMLOptionElement>

interface ParsedOption {
  value: string
  // ข้อความที่โชว์ในแต่ละแถวของรายการ (สั้น กระชับ อ่านง่ายเวลาสแกนยาวๆ)
  listLabel: string
  // ข้อความที่โชว์ตอน select ปิดอยู่ — ใช้ attribute `label` ของ <option> ถ้ามี (ให้บริบทครบแม้ listLabel จะสั้น)
  // ไม่งั้น fallback เป็น listLabel เหมือนเดิม
  triggerLabel: string
  disabled: boolean
  groupLabel?: string
  // ป้ายกรองระดับสูงกว่ากลุ่ม (เช่นหมวดหมู่ครอบหลายรุ่น) มาจาก data-chip บน <optgroup>
  // มีก็ต่อเมื่อผู้ใช้ component ตั้งใจส่งมา ไม่งั้นไม่โชว์แถบชิปเลย (backward compatible)
  chip?: string
}

interface FlatOption {
  element: ReactElement<OptionProps>
  groupLabel?: string
  chip?: string
}

// Children.toArray does not descend into <>...</> Fragments, so options
// nested inside one (e.g. a static <option> alongside a mapped array) would
// otherwise be treated as a single opaque child and stringified as
// "[object Object]". Recurse into Fragments to flatten them first.
// <optgroup> is flattened the same way, but its options are tagged with the
// group's label (and optional data-chip category) so the dropdown can render
// a header divider / chip filter above them.
function flattenOptionElements(children: ReactNode, groupLabel?: string, chip?: string): FlatOption[] {
  const result: FlatOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Fragment) {
      result.push(...flattenOptionElements((child.props as { children?: ReactNode }).children, groupLabel, chip))
    } else if (child.type === 'optgroup') {
      const groupProps = child.props as { label?: string; children?: ReactNode; 'data-chip'?: string }
      result.push(...flattenOptionElements(groupProps.children, groupProps.label, groupProps['data-chip'] ?? chip))
    } else {
      result.push({ element: child as ReactElement<OptionProps>, groupLabel, chip })
    }
  })
  return result
}

function parseOptions(children: React.ReactNode): ParsedOption[] {
  return flattenOptionElements(children).map(({ element: c, groupLabel, chip }) => {
    const listLabel = String(c.props.children ?? '')
    return {
      value: String(c.props.value ?? ''),
      listLabel,
      triggerLabel: c.props.label ?? listLabel,
      disabled: !!c.props.disabled,
      groupLabel,
      chip,
    }
  })
}

// รายการยาวเกินไปเลื่อนหาไม่จบ — เกินจำนวนนี้ค่อยโชว์ช่องค้นหาให้พิมพ์กรองแทน
const SEARCH_THRESHOLD = 8

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, value, onChange, defaultValue, onBlur, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [query, setQuery] = useState('')
    const [activeChip, setActiveChip] = useState<string | null>(null)
    const internalRef = useRef<HTMLSelectElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
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
    const showSearch = dropdownOptions.length > SEARCH_THRESHOLD

    // Distinct chip categories in first-seen order, with a count each — only shown
    // when the caller actually tagged options via data-chip and there's more than one
    const chips: { label: string; count: number }[] = []
    for (const o of dropdownOptions) {
      if (!o.chip) continue
      const existing = chips.find((c) => c.label === o.chip)
      if (existing) existing.count++
      else chips.push({ label: o.chip, count: 1 })
    }
    const showChips = chips.length > 1

    const chipFiltered = activeChip ? dropdownOptions.filter((o) => o.chip === activeChip) : dropdownOptions
    const trimmedQuery = query.trim().toLowerCase()
    const filteredDropdownOptions =
      showSearch && trimmedQuery
        ? chipFiltered.filter((o) => `${o.groupLabel ?? ''} ${o.triggerLabel}`.toLowerCase().includes(trimmedQuery))
        : chipFiltered
    // Flat, in-render-order list used for keyboard navigation
    const navOptions = placeholderOption ? [placeholderOption, ...filteredDropdownOptions] : filteredDropdownOptions

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
          setQuery('')
          setActiveChip(null)
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

    // Autofocus the search box so users can start typing the moment a long list opens
    useEffect(() => {
      if (open && showSearch) searchInputRef.current?.focus()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, showSearch])

    // Filtering changes what's selectable — keep the highlighted row valid as the query/chip changes
    useEffect(() => {
      if (!open) return
      const fallbackIdx = navOptions.findIndex((o) => !o.disabled)
      setActiveIndex(fallbackIdx)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, activeChip])

    function handleSelect(optValue: string) {
      if (!isControlled) {
        setUncontrolledValue(optValue)
      }
      if (internalRef.current) {
        internalRef.current.value = optValue
      }
      setOpen(false)
      setQuery('')
      setActiveChip(null)
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
      setQuery('')
      setActiveChip(null)
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
        if (!navOptions[idx].disabled && navOptions[idx].triggerLabel.toLowerCase().startsWith(buf.query)) {
          setActiveIndex(idx)
          return
        }
      }
    }

    // Shared nav-key handling for both the trigger button and the search box.
    // `allowTypeahead` is off for the search box — there, letter keys must type
    // into the input instead of jumping the list.
    function handleListKeyDown(e: React.KeyboardEvent, allowTypeahead: boolean) {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault()
          moveActive(e.key === 'ArrowDown' ? 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          selectActive()
          break
        case 'Escape':
          e.preventDefault()
          closeDropdown(true)
          break
        case 'Home':
          e.preventDefault()
          moveToEdge('first')
          break
        case 'End':
          e.preventDefault()
          moveToEdge('last')
          break
        case 'Tab':
          setOpen(false)
          setQuery('')
          setActiveChip(null)
          break
        default:
          if (allowTypeahead && e.key.length === 1) {
            e.preventDefault()
            typeahead(e.key)
          }
      }
    }

    function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      if (props.disabled) return
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDropdown()
        }
        return
      }
      handleListKeyDown(e, true)
    }

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      handleListKeyDown(e, false)
    }

    const isEmpty = !selectedOption || selectedOption.value === ''
    const displayLabel = isEmpty
      ? (placeholderOption?.triggerLabel ?? 'เลือก...')
      : (selectedOption?.triggerLabel ?? '')

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
            className={cn(
              'absolute left-0 right-0 top-[calc(100%+6px)] z-50 flex flex-col overflow-hidden',
              'rounded-xl border border-slate-100 bg-white shadow-lg',
              'dark:border-slate-800 dark:bg-slate-900',
              'animate-slide-down',
            )}
          >
            {showChips && (
              <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setActiveChip(null)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-100',
                    activeChip === null
                      ? 'bg-brand-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600',
                  )}
                >
                  ทั้งหมด <span className="opacity-75">{dropdownOptions.length}</span>
                </button>
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setActiveChip(chip.label === activeChip ? null : chip.label)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-100',
                      activeChip === chip.label
                        ? 'bg-brand-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600',
                    )}
                  >
                    {chip.label} <span className="opacity-75">{chip.count}</span>
                  </button>
                ))}
              </div>
            )}

            {showSearch && (
              <div className="shrink-0 border-b border-slate-100 p-2 dark:border-slate-800">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/70">
                  <Search size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="พิมพ์เพื่อค้นหา..."
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            <div id={listboxId} role="listbox" className="max-h-72 overflow-y-auto py-1">
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
                  <span className="flex-1 italic">{placeholderOption.listLabel}</span>
                  {displayValue === '' && <Check size={13} className="shrink-0 text-brand-500" />}
                </button>
              )}

              {placeholderOption && filteredDropdownOptions.length > 0 && (
                <div className="mx-3 my-1 border-t border-slate-100 dark:border-slate-800" />
              )}

              {filteredDropdownOptions.length === 0 && (trimmedQuery || activeChip) && (
                <p className="px-3.5 py-3 text-center text-sm text-slate-400 dark:text-slate-500">
                  {trimmedQuery ? `ไม่พบตัวเลือกที่ตรงกับ "${query.trim()}"` : 'ไม่พบตัวเลือกในหมวดนี้'}
                </p>
              )}

              {filteredDropdownOptions.map((opt, i) => {
                const idx = placeholderOption ? i + 1 : i
                const prevGroupLabel = i > 0 ? filteredDropdownOptions[i - 1].groupLabel : undefined
                const showGroupHeader = !!opt.groupLabel && opt.groupLabel !== prevGroupLabel
                return (
                  <Fragment key={opt.value}>
                    {showGroupHeader && (
                      <div className="sticky top-0 z-[1] border-b border-slate-100 bg-slate-50/95 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/95 dark:text-slate-400">
                        {opt.groupLabel}
                      </div>
                    )}
                    <button
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
                      <span className="flex-1">{opt.listLabel}</span>
                      {opt.value === displayValue && <Check size={13} className="shrink-0 text-brand-500" />}
                    </button>
                  </Fragment>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  },
)
Select.displayName = 'Select'
