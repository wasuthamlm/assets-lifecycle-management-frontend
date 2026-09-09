import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goodsReceiptsService } from '@/api/services/goods-receipts.service'
import type { CreateGoodsReceiptDto, QueryGoodsReceiptDto } from '@/api/types/goods-receipt.types'

export function useGoodsReceiptsQuery(query: QueryGoodsReceiptDto = {}) {
  return useQuery({
    queryKey: ['goods-receipts', query],
    queryFn: () => goodsReceiptsService.list(query),
    placeholderData: keepPreviousData,
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
