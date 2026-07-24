import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stockService } from '@/api/services/stock.service'
import type { AdjustStockDto, CreateStockItemDto, UpdateStockItemDto } from '@/api/types/stock.types'

export function useStockItemsQuery() {
  return useQuery({ queryKey: ['stock-items'], queryFn: () => stockService.listItems() })
}

export function useStockItemQuery(id: number) {
  return useQuery({
    queryKey: ['stock-items', id],
    queryFn: () => stockService.getItem(id),
    enabled: !!id,
  })
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

export function useUpdateStockItemMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateStockItemDto) => stockService.updateItem(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] })
    },
  })
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: AdjustStockDto) => stockService.adjust(dto),
    onSuccess: (level) => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] })
      queryClient.invalidateQueries({ queryKey: ['stock-levels', 'location', level.locationId] })
    },
  })
}
