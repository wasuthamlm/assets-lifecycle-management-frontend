import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warrantyService } from '@/api/services/warranty.service'
import type { CreateWarrantyDto, RenewWarrantyDto } from '@/api/types/warranty.types'

export function useWarrantiesByAssetQuery(assetId: number) {
  return useQuery({
    queryKey: ['warranties', 'asset', assetId],
    queryFn: () => warrantyService.byAsset(assetId),
    enabled: !!assetId,
  })
}

export function useWarrantyQuery(id: number) {
  return useQuery({
    queryKey: ['warranties', id],
    queryFn: () => warrantyService.get(id),
    enabled: !!id,
  })
}

export function useCreateWarrantyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateWarrantyDto) => warrantyService.create(dto),
    onSuccess: (warranty) => {
      queryClient.invalidateQueries({ queryKey: ['warranties', 'asset', warranty.assetId] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useRenewWarrantyMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: RenewWarrantyDto) => warrantyService.renew(id, dto),
    onSuccess: (warranty) => {
      queryClient.invalidateQueries({ queryKey: ['warranties', id] })
      queryClient.invalidateQueries({ queryKey: ['warranties', 'asset', warranty.assetId] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}
