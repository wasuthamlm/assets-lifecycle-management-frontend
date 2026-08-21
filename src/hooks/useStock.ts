import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stockService } from '@/api/services/stock.service'
import type { CreateStockItemDto } from '@/api/types/stock.types'

export function useStockItemsQuery() {
  return useQuery({ queryKey: ['stock-items'], queryFn: () => stockService.listItems() })
}

export function useStockLevelsByLocationQuery(locationId: number) {
  return useQuery({
    queryKey: ['stock-levels', 'location', locationId],
    queryFn: () => stockService.levelsByLocation(locationId),
    enabled: !!locationId,
  })
}

export function useCreateStockItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateStockItemDto) => stockService.createItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] })
    },
  })
}

