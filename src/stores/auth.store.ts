import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurrentUser } from '@/api/types/auth.types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: CurrentUser | null
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: CurrentUser | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'auth-storage' },
  ),
)

export function hasPermission(code: string): boolean {
  return useAuthStore.getState().user?.permissions.includes(code) ?? false
}
