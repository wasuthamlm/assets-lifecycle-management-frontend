export interface StockLevel {
  stockLevelId: number
  stockItemId: number
  stockItem?: { stockItemId: number; itemName: string; unit: string | null } | null
  locationId: number
  location?: { locationId: number; locationName: string } | null
  quantityOnHand: number
  updatedAt: string | null
}

export interface StockItem {
  stockItemId: number
  categoryId: number | null
  category?: { categoryId: number; categoryName: string } | null
  itemName: string
  unit: string | null
  description: string | null
  stockLevels?: StockLevel[]
}

export interface CreateStockItemDto {
  categoryId: number
  itemName: string
  unit?: string
  description?: string
}

export type UpdateStockItemDto = Partial<CreateStockItemDto>

export interface AdjustStockDto {
  stockItemId: number
  locationId: number
  delta: number
}
