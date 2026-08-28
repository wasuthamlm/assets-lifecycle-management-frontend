import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  theme: Theme
  setTheme: (theme: Theme) => void
  notificationSoundMuted: boolean
  toggleNotificationSound: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      notificationSoundMuted: false,
      toggleNotificationSound: () => set({ notificationSoundMuted: !get().notificationSoundMuted }),
    }),
    { name: 'ui-storage' },
  ),
)

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
