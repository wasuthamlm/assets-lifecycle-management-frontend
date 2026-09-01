import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignmentsService } from '@/api/services/assignments.service'
import type { IssueAssetDto, ReturnAssetDto } from '@/api/types/assignment.types'

export function useAssignmentsByAssetQuery(assetId: number | undefined) {
  return useQuery({
    queryKey: ['assignments', 'asset', assetId],
    queryFn: () => assignmentsService.listByAsset(assetId as number),
    enabled: !!assetId,
  })
}

export function usePendingReturnsQuery() {
  return useQuery({
    queryKey: ['assignments', 'pending-returns'],
    queryFn: () => assignmentsService.listPendingReturns(),
  })
}

/** ทรัพย์สินที่ผู้ใช้ปัจจุบันถือครองอยู่ (ยังไม่คืน) — ใช้ endpoint /assignments/mine ตรงๆ แทนการดึง
 * asset ทั้งหมดมากรองเองฝั่ง client (ซึ่งตัดข้อมูลทิ้งได้เมื่อทรัพย์สินทั่วบริษัทเกิน limit ของ query) */
export function useMyAssignmentsQuery() {
  return useQuery({
    queryKey: ['assignments', 'mine'],
    queryFn: () => assignmentsService.mine(),
  })
}

export function useAssignmentQuery(id: number) {
  return useQuery({
    queryKey: ['assignments', id],
    queryFn: () => assignmentsService.get(id),
    enabled: !!id,
  })
}

export function useIssueAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: IssueAssetDto) => assignmentsService.issue(dto),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', 'asset', assignment.assetId] })
      queryClient.invalidateQueries({ queryKey: ['assignments', 'pending-returns'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useReturnAssetMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: ReturnAssetDto) => assignmentsService.return(id, dto),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', 'asset', assignment.assetId] })
      queryClient.invalidateQueries({ queryKey: ['assignments', id] })
      queryClient.invalidateQueries({ queryKey: ['assignments', 'pending-returns'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}
