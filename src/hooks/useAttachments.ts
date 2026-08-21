import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attachmentsService } from '@/api/services/attachments.service'
import type { AttachmentReferenceType } from '@/api/types/attachment.types'

export function useAttachmentsQuery(referenceType: AttachmentReferenceType, referenceId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['attachments', referenceType, referenceId],
    queryFn: () => attachmentsService.listByReference(referenceType, referenceId as number),
    enabled: !!referenceId && enabled,
  })
}

export function useUploadAttachmentMutation(referenceType: AttachmentReferenceType, referenceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      attachmentsService.upload(file, referenceType, referenceId, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', referenceType, referenceId] })
    },
  })
}

export function useDeleteAttachmentMutation(referenceType: AttachmentReferenceType, referenceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => attachmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', referenceType, referenceId] })
    },
  })
}
