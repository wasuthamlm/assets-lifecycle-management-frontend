import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requisitionsService } from '@/api/services/requisitions.service'
import { generateNextDocNo } from '@/lib/docNo'
import type { ApproveRequisitionDto, CreateRequisitionDto } from '@/api/types/requisition.types'

export function useRequisitionsQuery() {
  return useQuery({
    queryKey: ['requisitions'],
    queryFn: () => requisitionsService.list(),
  })
}

export function useNextRequisitionNo() {
  const { data = [] } = useRequisitionsQuery()
  return generateNextDocNo(data.map((r) => r.requisitionNo), 'REQ')
}

export function useRequisitionQuery(id: number) {
  return useQuery({
    queryKey: ['requisitions', id],
    queryFn: () => requisitionsService.get(id),
    enabled: !!id,
  })
}

export function useCreateRequisitionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRequisitionDto) => requisitionsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useApproveRequisitionMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: ApproveRequisitionDto) => requisitionsService.approve(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
