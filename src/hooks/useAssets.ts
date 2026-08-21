import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetsService } from '@/api/services/assets.service'
import type { CreateAssetDto, QueryAssetDto, UpdateAssetDto } from '@/api/types/asset.types'

export function useAssetsQuery(query: QueryAssetDto = {}) {
  return useQuery({
    queryKey: ['assets', query],
    queryFn: () => assetsService.list(query),
    placeholderData: keepPreviousData,
  })
}

export function useAssetQuery(id: number) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => assetsService.get(id),
    enabled: !!id,
  })
}

export function useCreateAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAssetDto) => assetsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateAssetMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateAssetDto) => assetsService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}
