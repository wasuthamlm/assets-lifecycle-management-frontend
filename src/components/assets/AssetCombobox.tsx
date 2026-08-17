import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { useAssetsQuery, useAssetQuery } from '@/hooks/useAssets'
import { cn } from '@/lib/utils'

interface AssetComboboxProps {
  value: number | undefined
  onChange: (assetId: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const RESULT_LIMIT = 20

export function AssetCombobox({ value, onChange, placeholder = 'พิมพ์เพื่อค้นหาเลขทรัพย์สินหรือชื่อ...', disabled, className }: AssetComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const { data: resultsPage, isFetching } = useAssetsQuery({ search: debouncedQuery || undefined, limit: RESULT_LIMIT })
  const { data: selectedAsset } = useAssetQuery(value ?? 0)
  const results = resultsPage?.data ?? []

  useEffect(() => {
    setActiveIndex(0)
  }, [debouncedQuery, open])

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function openDropdown() {
    if (disabled) return
    setQuery('')
    setDebouncedQuery('')
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function select(assetId: number) {
    onChange(assetId)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[activeIndex]) select(results[activeIndex].assetId)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  const displayLabel = selectedAsset ? `${selectedAsset.assetNo} — ${selectedAsset.assetName}` : ''

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm transition-all duration-200',
          open
            ? 'border-brand-500 ring-2 ring-brand-500/25 dark:ring-brand-500/20'
            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
          disabled && 'cursor-not-allowed opacity-50',
          'dark:bg-slate-900',
        )}
      >
        <span className={cn('truncate text-left', displayLabel ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500')}>
          {displayLabel || 'เลือกทรัพย์สิน'}
        </span>
        <ChevronDown size={15} className={cn('shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-slate-100 bg-white shadow-lg',
            'dark:border-slate-800 dark:bg-slate-900',
            'animate-slide-down',
          )}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
            {value !== undefined && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined)
                  setOpen(false)
                }}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="ล้างค่าที่เลือก"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {isFetching ? (
              <p className="px-3.5 py-3 text-center text-sm text-slate-400">กำลังค้นหา...</p>
            ) : results.length === 0 ? (
              <p className="px-3.5 py-3 text-center text-sm text-slate-400">
                {debouncedQuery ? `ไม่พบทรัพย์สินที่ตรงกับ "${debouncedQuery}"` : 'ไม่มีทรัพย์สิน'}
              </p>
            ) : (
              results.map((a, i) => (
                <button
                  key={a.assetId}
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => select(a.assetId)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 px-3.5 py-2 text-left text-sm transition-colors duration-100',
                    i === activeIndex || a.assetId === value
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                  )}
                >
                  <span className="font-medium">{a.assetNo}</span>
                  <span className="truncate text-xs text-slate-400">{a.assetName}</span>
                </button>
              ))
            )}
            {results.length >= RESULT_LIMIT && (
              <p className="px-3.5 py-2 text-center text-xs text-slate-400">พิมพ์เพื่อค้นหาให้แคบลง หากไม่พบรายการที่ต้องการ</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
