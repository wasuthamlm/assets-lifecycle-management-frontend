import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { purchaseOrdersService } from '@/api/services/purchase-orders.service'
import type {
  CreatePurchaseOrderDto,
  QueryPurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from '@/api/types/purchase-order.types'

export function usePurchaseOrdersQuery(query: QueryPurchaseOrderDto = {}) {
  return useQuery({
    queryKey: ['purchase-orders', query],
    queryFn: () => purchaseOrdersService.list(query),
    placeholderData: keepPreviousData,
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

export function usePurchaseOrderQuery(id: number) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersService.get(id),
    enabled: !!id,
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
