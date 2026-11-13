import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/api/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { takePostLoginRedirect } from '@/lib/postLoginRedirect'
import type {
  ChangePasswordDto,
  CompleteEmployeeProfileDto,
  CurrentUser,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SsoExchangeDto,
  UpdateMyEmployeeProfileDto,
} from '@/api/types/auth.types'

/** ใช้เทียบว่าสิทธิ์เปลี่ยนไหม — ไม่สนลำดับที่ backend ส่งมา */
export function permissionSignature(user: Pick<CurrentUser, 'permissions' | 'roles'> | null | undefined) {
  if (!user) return ''
  return `${[...user.roles].sort().join(',')}|${[...user.permissions].sort().join(',')}`
}

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const previous = useAuthStore.getState().user
      const user = await authService.me()
      setUser(user)
      // admin เพิ่งเปลี่ยน role/สิทธิ์ของเรา — ข้อมูลทุกหน้าที่โหลดไว้ใต้สิทธิ์เดิม (รายการที่ scope ตาม view_all,
      // หน้าที่เคยโดน 403) ยังค้างใน cache ต้อง refetch ทั้งหมด ไม่งั้นหน้าจอไม่เปลี่ยนจนกว่าจะกด refresh เอง
      if (previous && permissionSignature(previous) !== permissionSignature(user)) {
        queryClient.invalidateQueries({ predicate: (q) => !(q.queryKey[0] === 'auth' && q.queryKey[1] === 'me') })
      }
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
      // มาจากหน้า LIFF "เชื่อมบัญชี LINE" → กลับไปหน้านั้น (ต้องเปลี่ยนรหัสผ่านก่อนยังคงบังคับเหมือนเดิม)
      const redirect = takePostLoginRedirect()
      navigate(tokens.mustChangePassword ? '/change-password' : (redirect ?? '/assets'))
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
      // มาจากหน้า LIFF "เชื่อมบัญชี LINE" → กลับไปหน้านั้น (ต้องเปลี่ยนรหัสผ่านก่อนยังคงบังคับเหมือนเดิม)
      const redirect = takePostLoginRedirect()
      navigate(tokens.mustChangePassword ? '/change-password' : (redirect ?? '/assets'))
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

export function useCompleteEmployeeProfile() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (dto: CompleteEmployeeProfileDto) => authService.completeEmployeeProfile(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/assets')
    },
  })
}

export function useUpdateMyEmployeeProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: UpdateMyEmployeeProfileDto) => authService.updateMyEmployeeProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      // อาจเพิ่งสร้างแผนกใหม่ (newDepartmentName) — dropdown แผนกหน้าอื่นต้องเห็นด้วย
      queryClient.invalidateQueries({ queryKey: ['departments'] })
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
