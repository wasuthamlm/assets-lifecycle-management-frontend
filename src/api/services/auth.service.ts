import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type {
  ChangePasswordDto,
  CurrentUser,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  TokenPair,
} from '../types/auth.types'

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
  async changePassword(dto: ChangePasswordDto): Promise<void> {
    await apiClient.patch(ENDPOINTS.auth.changePassword, dto)
  },
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    await apiClient.post(ENDPOINTS.auth.forgotPassword, dto)
  },
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    await apiClient.post(ENDPOINTS.auth.resetPassword, dto)
  },
}
