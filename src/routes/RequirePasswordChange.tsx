import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export function RequirePasswordChange() {
  const user = useAuthStore((s) => s.user)

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
