import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requisitionsService } from '@/api/services/requisitions.service'
import type { RequestType } from '@/api/types/common.types'
import type { ApproveRequisitionDto, CreateRequisitionDto, QueryRequisitionDto } from '@/api/types/requisition.types'

export function useRequisitionsQuery(query: QueryRequisitionDto = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['requisitions', query],
    queryFn: () => requisitionsService.list(query),
    enabled: options?.enabled,
    placeholderData: keepPreviousData,
  })
}

export function useMyRequisitionsQuery(query: QueryRequisitionDto = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['requisitions', 'mine', query],
    queryFn: () => requisitionsService.mine(query),
    enabled: options?.enabled,
    placeholderData: keepPreviousData,
  })
}

// เลขที่เอกสารเป็นแค่ preview ฝั่ง client — ตัวจริง server คำนวณอีกครั้งตอนบันทึก (กัน race condition)
// เรียก endpoint เบา ๆ ที่ใช้สิทธิ์ requisition.create เท่านั้น ไม่ต้องมี view_all
// เบิก/ยืม รันเลข sequence แยกกันคนละ prefix — ต้องผูก requestType ไว้ใน queryKey ด้วย
// ไม่งั้นสลับ เบิก<->ยืม แล้ว react-query จะคืนเลขที่ cache ไว้ของประเภทเดิมมาแสดงผิดๆ แบบไม่มี error ให้เห็น
export function useNextRequisitionNo(requestType: RequestType) {
  const { data } = useQuery({
    queryKey: ['requisitions', 'next-no', requestType],
    queryFn: () => requisitionsService.nextNo(requestType),
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

export function useRequisitionAttachmentsQuery(requisitionId: number) {
  return useQuery({
    queryKey: ['requisitions', requisitionId, 'attachments'],
    queryFn: () => requisitionsService.listAttachments(requisitionId),
    enabled: !!requisitionId,
  })
}

export function useUploadRequisitionAttachmentMutation(requisitionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      requisitionsService.uploadAttachment(requisitionId, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions', requisitionId, 'attachments'] })
    },
  })
}

export function useDeleteRequisitionAttachmentMutation(requisitionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: number) => requisitionsService.removeAttachment(requisitionId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions', requisitionId, 'attachments'] })
    },
  })
}
