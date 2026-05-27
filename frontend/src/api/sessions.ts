import { apiClient } from './client'
import type {
  NewSessionRequest,
  NewSessionResponse,
  SessionDetailResponse,
  SessionSummary,
} from '@/types/api'

export const sessionsApi = {
  /** List all projects for the current user */
  list: () =>
    apiClient
      .get<SessionSummary[]>('/api/sessions')
      .then((r) => r.data),

  /** Create a new project / session */
  create: (body: NewSessionRequest) =>
    apiClient
      .post<NewSessionResponse>('/api/sessions', body)
      .then((r) => r.data),

  /** Full session detail with message history */
  get: (sessionId: string) =>
    apiClient
      .get<SessionDetailResponse>(`/api/sessions/${sessionId}`)
      .then((r) => r.data),

  /** Rename a project */
  rename: (sessionId: string, name: string) =>
    apiClient
      .put<SessionSummary>(`/api/sessions/${sessionId}/name`, { name })
      .then((r) => r.data),

  /** Delete a project and all its messages */
  remove: (sessionId: string) =>
    apiClient
      .delete(`/api/sessions/${sessionId}`)
      .then(() => undefined as void),
}
