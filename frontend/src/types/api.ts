// ── Request types ────────────────────────────────────────────────
export interface NewSessionRequest {
  ddl?: string
}

export interface SendMessageRequest {
  content: string
}

// ── Response types ───────────────────────────────────────────────
export interface NewSessionResponse {
  sessionId: string
  message: string
  diagram: string | null
  complete: boolean
}

export interface SendMessageResponse {
  messageId: string
  content: string
  diagram: string | null
  complete: boolean
}

export interface MessageDto {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface SessionDetailResponse {
  sessionId: string
  createdAt: string
  lastActivity: string
  currentDiagram: string | null
  complete: boolean
  messages: MessageDto[]
}

// ── Error shape ──────────────────────────────────────────────────
export interface ApiError {
  code: string
  message: string
  details?: string[]
  timestamp: string
}
