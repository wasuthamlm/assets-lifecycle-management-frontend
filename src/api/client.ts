import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { ENDPOINTS } from './endpoints'
import type { TokenPair } from './types/auth.types'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null

  try {
    const { data } = await axios.post<TokenPair>(
      `${import.meta.env.VITE_API_BASE_URL}${ENDPOINTS.auth.refresh}`,
      { refreshToken },
    )
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    useAuthStore.getState().clear()
    return null
  }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// ต้องตรงกับข้อความใน PasswordChangeGuard ฝั่ง backend เป๊ะๆ — ใช้แยกแยะ 403 นี้ออกจาก
// 403 อื่นๆ (ไม่มีสิทธิ์) เผื่อ guard นี้ทำงานนอก flow ที่ frontend คาดไว้ (เช่น session เก่าค้างอยู่)
const MUST_CHANGE_PASSWORD_MESSAGE = 'ต้องเปลี่ยนรหัสผ่านก่อนใช้งานส่วนอื่นของระบบ'

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined

    if (
      error.response?.status === 403 &&
      (error.response.data as { message?: string } | undefined)?.message === MUST_CHANGE_PASSWORD_MESSAGE &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/change-password'
    ) {
      window.location.href = '/change-password'
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)
