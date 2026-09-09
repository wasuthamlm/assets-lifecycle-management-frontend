import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Paginated } from '../types/common.types'
import type {
  CreatePurchaseOrderDto,
  PurchaseOrder,
  QueryPurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from '../types/purchase-order.types'

export const purchaseOrdersService = {
  async list(query: QueryPurchaseOrderDto = {}): Promise<Paginated<PurchaseOrder>> {
    const { data } = await apiClient.get<Paginated<PurchaseOrder>>(ENDPOINTS.purchaseOrders.base, { params: query })
    return data
  },
  async get(id: number): Promise<PurchaseOrder> {
    const { data } = await apiClient.get<PurchaseOrder>(ENDPOINTS.purchaseOrders.byId(id))
    return data
  },
  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const { data } = await apiClient.post<PurchaseOrder>(ENDPOINTS.purchaseOrders.base, dto)
    return data
  },
  async updateStatus(id: number, dto: UpdatePurchaseOrderStatusDto): Promise<PurchaseOrder> {
    const { data } = await apiClient.patch<PurchaseOrder>(ENDPOINTS.purchaseOrders.status(id), dto)
    return data
  },
}
