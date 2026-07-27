import type { PoStatus } from './common.types'

export interface PurchaseOrderItem {
  poItemId: number
  poId: number
  categoryId: number | null
  category?: { categoryId: number; categoryName: string } | null
  itemDescription: string
  quantity: number
  unitPrice: number | null
  receivedQuantity: number
}

export interface PurchaseOrder {
  poId: number
  poNo: string
  vendorId: number | null
  vendor?: { vendorId: number; vendorName: string } | null
  orderDate: string | null
  expectedDeliveryDate: string | null
  requestedBy: number | null
  approvedBy: number | null
  status: PoStatus
  totalAmount: number | null
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string | null
}

export interface CreatePurchaseOrderItemDto {
  categoryId?: number
  itemDescription: string
  quantity: number
  unitPrice?: number
}

export interface CreatePurchaseOrderDto {
  vendorId: number
  orderDate?: string
  expectedDeliveryDate?: string
  items: CreatePurchaseOrderItemDto[]
}

export interface UpdatePurchaseOrderStatusDto {
  status: PoStatus
}
