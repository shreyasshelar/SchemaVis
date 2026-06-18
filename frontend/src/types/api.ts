// ── Auth ──────────────────────────────────────────────────────────
export interface AuthResponse {
  token:       string
  userId:      string
  email:       string
  displayName: string
}

export interface UserDto {
  id:          string
  email:       string
  displayName: string
}

// ── Request types ─────────────────────────────────────────────────
export interface NewSessionRequest {
  ddl?:         string
  name?:        string
  seedDiagram?: string
  projectId?:   string   // assign to a folder on creation
}

export interface SendMessageRequest {
  content: string
}

// ── Response types ────────────────────────────────────────────────
export interface NewSessionResponse {
  sessionId: string
  message:   string
  diagram:   string | null
  complete:  boolean
  name:      string
}

export interface SendMessageResponse {
  messageId: string
  content:   string
  diagram:   string | null
  complete:  boolean
}

export interface MessageDto {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  createdAt: string
  isError?:  boolean   // local-only flag, never from API
}

export interface SessionDetailResponse {
  sessionId:      string
  name:           string
  createdAt:      string
  lastActivity:   string
  currentDiagram: string | null
  complete:       boolean
  messages:       MessageDto[]
}

/** Lightweight summary returned by GET /api/sessions (projects list) */
export interface SessionSummary {
  sessionId:    string
  name:         string
  createdAt:    string
  lastActivity: string
  complete:     boolean
  hasDiagram:   boolean
  messageCount: number
  projectId:    string | null   // null = ungrouped
}

// ── Project folder types ──────────────────────────────────────────
export interface FolderSummary {
  projectId: string
  name:      string
  createdAt: string
  sessions:  SessionSummary[]
}

export interface ProjectTree {
  folders:   FolderSummary[]
  ungrouped: SessionSummary[]
}

// ── Error shape ───────────────────────────────────────────────────
export interface ApiError {
  code:      string
  message:   string
  details?:  string[]
  timestamp: string
}
