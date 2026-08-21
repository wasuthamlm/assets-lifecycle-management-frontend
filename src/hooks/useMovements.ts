import { useQuery } from '@tanstack/react-query'
import { movementsService } from '@/api/services/movements.service'

export function useMovementsQuery() {
  return useQuery({ queryKey: ['movements'], queryFn: () => movementsService.list() })
}
