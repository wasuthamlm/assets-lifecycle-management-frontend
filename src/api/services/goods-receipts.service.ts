import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Paginated } from '../types/common.types'
import type { CreateGoodsReceiptDto, GoodsReceipt, QueryGoodsReceiptDto } from '../types/goods-receipt.types'

export const goodsReceiptsService = {
  async list(query: QueryGoodsReceiptDto = {}): Promise<Paginated<GoodsReceipt>> {
    const { data } = await apiClient.get<Paginated<GoodsReceipt>>(ENDPOINTS.goodsReceipts.base, { params: query })
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
