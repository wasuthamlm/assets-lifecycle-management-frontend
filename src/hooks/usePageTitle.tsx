import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface PageTitleContextValue {
  title: string
  setTitle: (title: string) => void
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null)

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  return <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>
}

export function usePageTitleContext() {
  const ctx = useContext(PageTitleContext)
  if (!ctx) throw new Error('usePageTitleContext must be used within PageTitleProvider')
  return ctx
}

export function usePageTitle(title: string) {
  const { setTitle } = usePageTitleContext()
  useEffect(() => {
    setTitle(title)
  }, [title, setTitle])
}
