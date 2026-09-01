import { HolderType } from '@/api/types/common.types'
import { HOLDER_TYPE_LABEL } from '@/lib/constants'
import type { Assignment } from '@/api/types/assignment.types'

// holderId เป็น polymorphic FK — ต้องเลือก field ชื่อที่ตรงกับ holderType เอาเอง
// (ดูคอมเมนต์ resolveHolder ฝั่ง backend, assignments.service.ts)
export function resolveHolderName(a: Pick<Assignment, 'holder' | 'holderType' | 'holderId'>): string {
  const fallback = `${HOLDER_TYPE_LABEL[a.holderType]} #${a.holderId}`
  if (!a.holder) return fallback
  switch (a.holderType) {
    case HolderType.EMPLOYEE:
      return a.holder.fullName ?? fallback
    case HolderType.DEPARTMENT:
      return a.holder.departmentName ?? fallback
    case HolderType.LOCATION:
      return a.holder.locationName ?? fallback
    case HolderType.VENDOR:
      return a.holder.vendorName ?? fallback
    default:
      return fallback
  }
}

export function resolveHolderDepartment(a: Pick<Assignment, 'holder' | 'holderType'>): string {
  if (a.holderType === HolderType.EMPLOYEE) return a.holder?.department?.departmentName ?? '-'
  if (a.holderType === HolderType.DEPARTMENT) return a.holder?.departmentName ?? '-'
  return '-'
}

export function resolveHolderPhone(a: Pick<Assignment, 'holder' | 'holderType'>): string {
  return a.holderType === HolderType.EMPLOYEE ? (a.holder?.phone ?? '-') : '-'
}
