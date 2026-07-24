import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goodsReceiptsService } from '@/api/services/goods-receipts.service'
import type { CreateGoodsReceiptDto } from '@/api/types/goods-receipt.types'

export function useGoodsReceiptsQuery() {
  return useQuery({
    queryKey: ['goods-receipts'],
    queryFn: () => goodsReceiptsService.list(),
  })
}

export function useGoodsReceiptQuery(id: number) {
  return useQuery({
    queryKey: ['goods-receipts', id],
    queryFn: () => goodsReceiptsService.get(id),
    enabled: !!id,
  })
}

export function useCreateGoodsReceiptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateGoodsReceiptDto) => goodsReceiptsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}
