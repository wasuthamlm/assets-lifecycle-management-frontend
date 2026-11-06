import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supportTicketsService } from '@/api/services/support-tickets.service'
import type {
  CreateTicketDto,
  EscalateToRepairDto,
  QueryTicketDto,
  UpdateTicketStatusDto,
} from '@/api/types/support-ticket.types'

export function useSupportTicketsQuery(query: QueryTicketDto = {}, enabled = true) {
  return useQuery({
    queryKey: ['support-tickets', 'all', query],
    queryFn: () => supportTicketsService.list(query),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMySupportTicketsQuery(query: QueryTicketDto = {}) {
  return useQuery({
    queryKey: ['support-tickets', 'mine', query],
    queryFn: () => supportTicketsService.mine(query),
    placeholderData: keepPreviousData,
  })
}

export function useSupportTicketQuery(id: number) {
  return useQuery({
    queryKey: ['support-tickets', id],
    queryFn: () => supportTicketsService.get(id),
    enabled: !!id,
  })
}

export function useCreateSupportTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTicketDto) => supportTicketsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })
}

export function useUpdateSupportTicketStatusMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateTicketStatusDto) => supportTicketsService.updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })
}

// ส่งซ่อม = สร้างงานซ่อม + asset เปลี่ยนเป็น under_repair ฝั่ง backend → ต้อง invalidate repairs/assets ด้วย
export function useEscalateSupportTicketMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: EscalateToRepairDto) => supportTicketsService.escalateToRepair(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useSupportTicketAttachmentsQuery(id: number) {
  return useQuery({
    queryKey: ['support-tickets', id, 'attachments'],
    queryFn: () => supportTicketsService.listAttachments(id),
    enabled: !!id,
  })
}

export function useUploadSupportTicketAttachmentMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      supportTicketsService.uploadAttachment(id, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', id, 'attachments'] })
    },
  })
}

export function useDeleteSupportTicketAttachmentMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: number) => supportTicketsService.removeAttachment(id, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', id, 'attachments'] })
    },
  })
}
