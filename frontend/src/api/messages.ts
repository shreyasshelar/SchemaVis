import { apiClient } from './client'
import type { SendMessageRequest, SendMessageResponse } from '@/types/api'

export const messagesApi = {
  send: (sessionId: string, body: SendMessageRequest) =>
    apiClient
      .post<SendMessageResponse>(`/api/sessions/${sessionId}/messages`, body)
      .then((r) => r.data),
}
