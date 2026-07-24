import { useAuthStore } from '@/stores/auth.store'

export function usePermission() {
  const user = useAuthStore((s) => s.user)

  function hasPermission(code: string): boolean {
    if (!user) return false
    return user.permissions.includes(code)
  }

  function hasAnyPermission(codes: string[]): boolean {
    return codes.some(hasPermission)
  }

  return { hasPermission, hasAnyPermission, permissions: user?.permissions ?? [] }
}
