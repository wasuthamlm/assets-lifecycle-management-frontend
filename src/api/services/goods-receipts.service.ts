import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { CreateGoodsReceiptDto, GoodsReceipt } from '../types/goods-receipt.types'

export const goodsReceiptsService = {
  async list(): Promise<GoodsReceipt[]> {
    const { data } = await apiClient.get<GoodsReceipt[]>(ENDPOINTS.goodsReceipts.base)
    return data
  },
  async get(id: number): Promise<GoodsReceipt> {
    const { data } = await apiClient.get<GoodsReceipt>(ENDPOINTS.goodsReceipts.byId(id))
    return data
  },
  async create(dto: CreateGoodsReceiptDto): Promise<GoodsReceipt> {
    const { data } = await apiClient.post<GoodsReceipt>(ENDPOINTS.goodsReceipts.base, dto)
    return data
  },
}
