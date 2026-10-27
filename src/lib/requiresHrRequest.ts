import type { Asset } from '@/api/types/asset.types'

// ทรัพย์สินในหมวดที่ตั้ง requiresHrRequest (เช่น notebook / tablet) — เช็คทั้งหมวดย่อยและหมวดหลัก
// พนักงานทั่วไปเลือกเองไม่ได้ ต้องให้ HR (requisition.create_on_behalf) ทำรายการให้ — ต้องตรงกับ RequisitionsService.create ฝั่ง backend
export function requiresHrRequest(asset: Pick<Asset, 'category'>): boolean {
  return !!(asset.category?.requiresHrRequest || asset.category?.parent?.requiresHrRequest)
}
