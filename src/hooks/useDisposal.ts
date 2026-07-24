import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { disposalService } from '@/api/services/disposal.service'
import type { CreateDisposalDto } from '@/api/types/disposal.types'

export function useDisposalsQuery() {
  return useQuery({ queryKey: ['disposals'], queryFn: () => disposalService.list() })
}

export function useDisposalQuery(id: number) {
  return useQuery({
    queryKey: ['disposals', id],
    queryFn: () => disposalService.get(id),
    enabled: !!id,
  })
}

export function useCreateDisposalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDisposalDto) => disposalService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disposals'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
