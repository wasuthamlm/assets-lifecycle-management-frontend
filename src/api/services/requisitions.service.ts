import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { ApproveRequisitionDto, CreateRequisitionDto, Requisition } from '../types/requisition.types'

export const requisitionsService = {
  async list(): Promise<Requisition[]> {
    const { data } = await apiClient.get<Requisition[]>(ENDPOINTS.requisitions.base)
    return data
  },
  async get(id: number): Promise<Requisition> {
    const { data } = await apiClient.get<Requisition>(ENDPOINTS.requisitions.byId(id))
    return data
  },
  async create(dto: CreateRequisitionDto): Promise<Requisition> {
    const { data } = await apiClient.post<Requisition>(ENDPOINTS.requisitions.base, dto)
    return data
  },
  async approve(id: number, dto: ApproveRequisitionDto): Promise<Requisition> {
    const { data } = await apiClient.post<Requisition>(ENDPOINTS.requisitions.approve(id), dto)
    return data
  },
  async nextNo(): Promise<string> {
    const { data } = await apiClient.get<{ requisitionNo: string }>(ENDPOINTS.requisitions.nextNo)
    return data.requisitionNo
  },
}
