import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { repairsService } from '@/api/services/repairs.service'
import type { CreateRepairDto, UpdateRepairStatusDto } from '@/api/types/repair.types'

export function useRepairsQuery() {
  return useQuery({
    queryKey: ['repairs'],
    queryFn: () => repairsService.list(),
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
