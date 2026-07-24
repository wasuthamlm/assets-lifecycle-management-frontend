import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from '@/routes/router'
import { applyTheme, useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useCurrentUser } from '@/hooks/useAuth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemeInitializer() {
  const theme = useUiStore((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  return null
}

function CurrentUserBootstrap() {
  useCurrentUser()
  return null
}

function App() {
  const accessToken = useAuthStore((s) => s.accessToken)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      {accessToken && <CurrentUserBootstrap />}
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}

export default App
