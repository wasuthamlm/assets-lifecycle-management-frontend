export interface GoodsReceiptItem {
  receiptItemId: number
  receiptId: number
  poItemId: number | null
  purchaseOrderItem?: { poItemId: number; itemDescription: string } | null
  assetId: number | null
  asset?: { assetId: number; assetNo: string; assetName: string } | null
  stockItemId: number | null
  stockItem?: { stockItemId: number; itemName: string } | null
  receivedQuantity: number | null
  conditionOnReceipt: string | null
}

export interface GoodsReceipt {
  receiptId: number
  receiptNo: string
  poId: number | null
  purchaseOrder?: { poId: number; poNo: string } | null
  receiptDate: string | null
  receivedBy: number | null
  locationId: number | null
  location?: { locationId: number; locationName: string } | null
  notes: string | null
  items: GoodsReceiptItem[]
  createdAt: string
}

export interface GoodsReceiptItemAssetInput {
  categoryId: number
  assetName: string
  serialNumber?: string
  brand?: string
  model?: string
  vendorId?: number
  purchaseCost?: number
  warrantyExpireDate?: string
}

export interface CreateGoodsReceiptItemDto {
  poItemId?: number
  assetData?: GoodsReceiptItemAssetInput
  stockItemId?: number
  receivedQuantity?: number
  conditionOnReceipt?: string
}

export interface CreateGoodsReceiptDto {
  receiptNo: string
  poId?: number
  receiptDate?: string
  locationId: number
  notes?: string
  items: CreateGoodsReceiptItemDto[]
}
