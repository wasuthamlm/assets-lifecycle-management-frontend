import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/api/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import type { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto, SsoExchangeDto } from '@/api/types/auth.types'

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
      navigate(tokens.mustChangePassword ? '/change-password' : '/assets')
    },
  })
}

// ใช้ตอน login ผ่าน Microsoft SSO — แลก Supabase access token (จากหน้า /auth/callback) เป็น TokenPair
// ของระบบเราเอง เหมือน useLogin ทุกประการหลังจากได้ tokens มาแล้ว
export function useSsoLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (dto: SsoExchangeDto) => authService.ssoExchange(dto),
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken)
      navigate(tokens.mustChangePassword ? '/change-password' : '/assets')
    },
  })
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => authService.changePassword(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/assets')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (dto: ForgotPasswordDto) => authService.forgotPassword(dto),
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => authService.resetPassword(dto),
    onSuccess: () => navigate('/login'),
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
