import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/api/services/users.service'
import type { UpdateUserDto } from '@/api/types/user.types'

export function useUsersQuery(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: ['users'], queryFn: () => usersService.list(), enabled: options?.enabled })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: number; dto: UpdateUserDto }) => usersService.update(userId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
