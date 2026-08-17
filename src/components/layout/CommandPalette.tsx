import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { NAV_TOP, NAV_CREATE_GROUP, NAV_GROUPS, type NavItem } from './navConfig'
import { usePermission } from '@/hooks/usePermission'
import { useCommandPaletteStore } from '@/stores/commandPalette.store'
import { cn } from '@/lib/utils'

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open)
  const setOpen = useCommandPaletteStore((s) => s.setOpen)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { hasPermission } = usePermission()

  const allItems: NavItem[] = useMemo(() => {
    const items = [NAV_TOP, ...NAV_CREATE_GROUP.items, ...NAV_GROUPS.flatMap((g) => g.items)]
    const seen = new Set<string>()
    return items.filter((i) => {
      if (seen.has(i.href)) return false
      seen.add(i.href)
      return true
    })
  }, [])

  const allowedItems = allItems.filter((i) => !i.permission || hasPermission(i.permission))
  const results = query.trim()
    ? allowedItems.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase()))
    : allowedItems

  // Global Ctrl/Cmd+K toggle
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useCommandPaletteStore.getState().open)
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function go(href: string) {
    navigate(href)
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
        if (results[activeIndex]) go(results[activeIndex].href)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 pt-[15vh] backdrop-blur-sm animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-sheet-in dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ไปที่หน้าไหน... พิมพ์เพื่อค้นหา"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 sm:inline">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">ไม่พบหน้าที่ตรงกับ &quot;{query}&quot;</p>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(item.href)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-100',
                    i === activeIndex
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'text-slate-700 dark:text-slate-200',
                  )}
                >
                  <Icon size={16} className="shrink-0 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
