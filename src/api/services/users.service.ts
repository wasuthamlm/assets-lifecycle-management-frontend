import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { User } from '../types/user.types'

export const usersService = {
  async list(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>(ENDPOINTS.users.base)
    return data
  },
}
