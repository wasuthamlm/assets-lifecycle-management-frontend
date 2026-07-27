import { Navigate, Outlet } from 'react-router-dom'
import { usePermission } from '@/hooks/usePermission'

interface PermissionRouteProps {
  permission: string
}

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { hasPermission } = usePermission()

  if (!hasPermission(permission)) {
    return <Navigate to="/my-items" replace />
  }

  return <Outlet />
}
