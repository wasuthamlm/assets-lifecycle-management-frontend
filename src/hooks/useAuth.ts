import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/api/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import type { LoginDto } from '@/api/types/auth.types'

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authService.me()
      setUser(user)
      return user
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (dto: LoginDto) => authService.login(dto),
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken)
      navigate('/dashboard')
    },
  })
}

// หมายเหตุ: ไม่ clear token/navigate ทันทีตอน logout สำเร็จ — ปล่อยให้ผู้เรียกใช้ (useLogoutFlow)
// เป็นคนสั่ง clear/navigate เอง หลังจากผู้ใช้ปิด modal ยืนยันแล้ว ไม่งั้น ProtectedRoute จะ redirect
// ไป /login ทันทีที่ accessToken หายไป ก่อนที่ modal จะทันได้แสดงผล
export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout(),
  })
}
