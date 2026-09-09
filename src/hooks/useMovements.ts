import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { movementsService } from '@/api/services/movements.service'
import type { QueryMovementDto } from '@/api/types/movement.types'

export function useMovementsQuery(query: QueryMovementDto = {}) {
  return useQuery({
    queryKey: ['movements', query],
    queryFn: () => movementsService.list(query),
    placeholderData: keepPreviousData,
  })
}
