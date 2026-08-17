import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requisitionsService } from '@/api/services/requisitions.service'
import type { ApproveRequisitionDto, CreateRequisitionDto } from '@/api/types/requisition.types'

export function useRequisitionsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['requisitions'],
    queryFn: () => requisitionsService.list(),
    enabled: options?.enabled,
  })
}

// เลขที่เอกสารเป็นแค่ preview ฝั่ง client — ตัวจริง server คำนวณอีกครั้งตอนบันทึก (กัน race condition)
// เรียก endpoint เบา ๆ ที่ใช้สิทธิ์ requisition.create เท่านั้น ไม่ต้องมี view_all
export function useNextRequisitionNo() {
  const { data } = useQuery({
    queryKey: ['requisitions', 'next-no'],
    queryFn: () => requisitionsService.nextNo(),
  })
  return data
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
