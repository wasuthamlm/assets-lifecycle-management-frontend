import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clear()
      queryClient.clear()
      navigate('/login')
    },
  })
}
