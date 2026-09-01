import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { Assignment, IssueAssetDto, ReturnAssetDto } from '../types/assignment.types'

export const assignmentsService = {
  async issue(dto: IssueAssetDto): Promise<Assignment> {
    const { data } = await apiClient.post<Assignment>(ENDPOINTS.assignments.issue, dto)
    return data
  },
  async return(id: number, dto: ReturnAssetDto): Promise<Assignment> {
    const { data } = await apiClient.post<Assignment>(ENDPOINTS.assignments.return(id), dto)
    return data
  },
  async listByAsset(assetId: number): Promise<Assignment[]> {
    const { data } = await apiClient.get<Assignment[]>(ENDPOINTS.assignments.byAsset(assetId))
    return data
  },
  async listPendingReturns(): Promise<Assignment[]> {
    const { data } = await apiClient.get<Assignment[]>(ENDPOINTS.assignments.base)
    return data
  },
  async mine(): Promise<Assignment[]> {
    const { data } = await apiClient.get<Assignment[]>(ENDPOINTS.assignments.mine)
    return data
  },
  async get(id: number): Promise<Assignment> {
    const { data } = await apiClient.get<Assignment>(ENDPOINTS.assignments.byId(id))
    return data
  },
}
