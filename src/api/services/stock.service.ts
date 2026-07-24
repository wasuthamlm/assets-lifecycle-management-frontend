import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { AdjustStockDto, CreateStockItemDto, StockItem, StockLevel, UpdateStockItemDto } from '../types/stock.types'

export const stockService = {
  async listItems(): Promise<StockItem[]> {
    const { data } = await apiClient.get<StockItem[]>(ENDPOINTS.stock.items)
    return data
  },
  async getItem(id: number): Promise<StockItem> {
    const { data } = await apiClient.get<StockItem>(ENDPOINTS.stock.itemById(id))
    return data
  },
  async createItem(dto: CreateStockItemDto): Promise<StockItem> {
    const { data } = await apiClient.post<StockItem>(ENDPOINTS.stock.items, dto)
    return data
  },
  async updateItem(id: number, dto: UpdateStockItemDto): Promise<StockItem> {
    const { data } = await apiClient.patch<StockItem>(ENDPOINTS.stock.itemById(id), dto)
    return data
  },
  async levelsByLocation(locationId: number): Promise<StockLevel[]> {
    const { data } = await apiClient.get<StockLevel[]>(ENDPOINTS.stock.levelsByLocation(locationId))
    return data
  },
  async adjust(dto: AdjustStockDto): Promise<StockLevel> {
    const { data } = await apiClient.post<StockLevel>(ENDPOINTS.stock.adjust, dto)
    return data
  },
}
