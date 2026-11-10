import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export interface DeviceOption {
  assetId: number
  label: string
  hint?: string
}

interface DeviceComboboxProps {
  id?: string
  options: DeviceOption[]
  assetId: number | undefined
  text: string
  onChange: (value: { assetId: number | undefined; text: string }) => void
  placeholder?: string
}

/**
 * ช่องอุปกรณ์ที่พิมพ์เองได้ และเลือกจากของที่ถือ/ยืมอยู่ได้
 * เลือกจากรายการ → ผูก assetId / พิมพ์แก้ทีหลัง → กลายเป็นข้อความอิสระ (ล้าง assetId)
 */
export function DeviceCombobox({ id, options, assetId, text, onChange, placeholder }: DeviceComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // เลือกไว้แล้วให้โชว์ทั้งรายการ ไม่กรองด้วยชื่อที่เลือก
  const query = assetId ? '' : text.trim().toLowerCase()
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options
  const showList = open && filtered.length > 0

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function select(o: DeviceOption) {
    onChange({ assetId: o.assetId, text: o.label })
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) setOpen(true)
        else setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        // กัน Enter ส่งฟอร์มตอนรายการเปิดอยู่
        if (showList && filtered[activeIndex]) {
          e.preventDefault()
          select(filtered[activeIndex])
        }
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          setOpen(false)
        }
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={text}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          onChange({ assetId: undefined, text: e.target.value })
          setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        className={cn(options.length > 0 && 'pr-16')}
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
        {text && (
          <button
            type="button"
            aria-label="ล้างช่องอุปกรณ์"
            onClick={() => onChange({ assetId: undefined, text: '' })}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={15} />
          </button>
        )}
        {options.length > 0 && (
          <button
            type="button"
            aria-label="แสดงรายการอุปกรณ์ของฉัน"
            tabIndex={-1}
            onClick={() => setOpen((v) => !v)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <ChevronDown size={16} className={cn('transition-transform duration-200', showList && 'rotate-180')} />
          </button>
        )}
      </div>

      {showList && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-white py-1 shadow-lg animate-slide-down dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="px-3.5 pb-1 pt-1.5 text-xs text-slate-400">อุปกรณ์ที่คุณเบิก/ยืมอยู่</p>
          {filtered.map((o, i) => (
            <button
              key={o.assetId}
              type="button"
              role="option"
              aria-selected={o.assetId === assetId}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => select(o)}
              className={cn(
                'flex w-full flex-col items-start gap-0.5 px-3.5 py-2 text-left text-sm transition-colors duration-100',
                i === activeIndex || o.assetId === assetId
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
              )}
            >
              <span className="font-medium">{o.label}</span>
              {o.hint && <span className="text-xs text-slate-400">{o.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
