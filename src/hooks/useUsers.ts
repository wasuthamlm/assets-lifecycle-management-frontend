import { useQuery } from '@tanstack/react-query'
import { usersService } from '@/api/services/users.service'

export function useUsersQuery() {
  return useQuery({ queryKey: ['users'], queryFn: () => usersService.list() })
}
