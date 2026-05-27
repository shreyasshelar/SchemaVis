import { apiClient } from './client'
import type { AuthResponse, UserDto } from '@/types/api'

export interface LoginPayload    { email: string; password: string }
export interface RegisterPayload { email: string; password: string; displayName: string }

export const authApi = {
  login: (body: LoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/login', body).then((r) => r.data),

  register: (body: RegisterPayload) =>
    apiClient.post<AuthResponse>('/api/auth/register', body).then((r) => r.data),

  me: () =>
    apiClient.get<UserDto>('/api/auth/me').then((r) => r.data),
}
