import { apiClient } from './client'
import type {
  NewSessionRequest,
  NewSessionResponse,
  SessionDetailResponse,
} from '@/types/api'

export const sessionsApi = {
  create: (body: NewSessionRequest) =>
    apiClient
      .post<NewSessionResponse>('/api/sessions', body)
      .then((r) => r.data),

  get: (sessionId: string) =>
    apiClient
      .get<SessionDetailResponse>(`/api/sessions/${sessionId}`)
      .then((r) => r.data),

  remove: (sessionId: string) =>
    apiClient
      .delete(`/api/sessions/${sessionId}`)
      .then(() => undefined as void),
}
