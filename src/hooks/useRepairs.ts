import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { repairsService } from '@/api/services/repairs.service'
import type { CreateRepairDto, QueryRepairDto, UpdateRepairStatusDto } from '@/api/types/repair.types'

export function useRepairsQuery(query: QueryRepairDto = {}) {
  return useQuery({
    queryKey: ['repairs', query],
    queryFn: () => repairsService.list(query),
    placeholderData: keepPreviousData,
  })
}

export function useRepairQuery(id: number) {
  return useQuery({
    queryKey: ['repairs', id],
    queryFn: () => repairsService.get(id),
    enabled: !!id,
  })
}

export function useCreateRepairMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRepairDto) => repairsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useUpdateRepairStatusMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateRepairStatusDto) => repairsService.updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}
