import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { UpdateUserDto, User } from '../types/user.types'

export const usersService = {
  async list(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>(ENDPOINTS.users.base)
    return data
  },

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const { data } = await apiClient.patch<User>(ENDPOINTS.users.byId(id), dto)
    return data
  },
}
