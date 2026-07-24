import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { CurrentUser, LoginDto, TokenPair } from '../types/auth.types'

export const authService = {
  async login(dto: LoginDto): Promise<TokenPair> {
    const { data } = await apiClient.post<TokenPair>(ENDPOINTS.auth.login, dto)
    return data
  },
  async me(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>(ENDPOINTS.auth.me)
    return data
  },
  async logout(): Promise<void> {
    await apiClient.post(ENDPOINTS.auth.logout)
  },
}
