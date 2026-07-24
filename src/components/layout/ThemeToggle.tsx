import { Moon, Sun } from 'lucide-react'
import { applyTheme, useUiStore } from '@/stores/ui.store'

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label="สลับธีมสี"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-50 active:scale-90 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <span className="animate-scale-in" key={theme}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </span>
    </button>
  )
}
