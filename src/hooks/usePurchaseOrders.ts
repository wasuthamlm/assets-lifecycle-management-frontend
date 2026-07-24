import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { purchaseOrdersService } from '@/api/services/purchase-orders.service'
import type { CreatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from '@/api/types/purchase-order.types'

export function usePurchaseOrdersQuery() {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchaseOrdersService.list(),
  })
}

export function usePurchaseOrderQuery(id: number) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersService.get(id),
    enabled: !!id,
  })
}

export function useCreatePurchaseOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderDto) => purchaseOrdersService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

export function useUpdatePurchaseOrderStatusMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdatePurchaseOrderStatusDto) => purchaseOrdersService.updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}
