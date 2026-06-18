import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MessageDto } from '@/types/api'

// ── UI state machine ─────────────────────────────────────────────
export type UIPhase =
  | 'idle'          // no session — show welcome / DDL input
  | 'chatting'      // active session, schema not yet complete
  | 'complete'      // schema finalised — show badge + locked diagram

// ── Store shape ──────────────────────────────────────────────────
interface AppState {
  // Session
  sessionId: string | null
  diagram: string | null           // latest Mermaid erDiagram string
  phase: UIPhase

  // Messages (kept locally for optimistic updates; source of truth = server)
  messages: MessageDto[]

  // UI helpers
  isSending: boolean               // debounce send button
  diagramVisible: boolean          // panel toggle on narrow viewports
  pendingComplete: boolean         // AI suggested complete — awaiting user approval

  // Actions
  startSession: (sessionId: string, firstMessage: MessageDto, diagram: string | null) => void
  appendMessage: (msg: MessageDto) => void
  removeErrorMessages: () => void
  updateDiagram: (diagram: string) => void
  setPhase: (phase: UIPhase) => void
  setIsSending: (v: boolean) => void
  setPendingComplete: (v: boolean) => void
  toggleDiagram: () => void
  resetSession: () => void
}

// ── Store ────────────────────────────────────────────────────────
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sessionId: null,
      diagram: null,
      phase: 'idle',
      messages: [],
      isSending: false,
      diagramVisible: true,
      pendingComplete: false,

      startSession: (sessionId, firstMessage, diagram) =>
        set({
          sessionId,
          diagram,
          phase: 'chatting',
          messages: [firstMessage],
        }),

      appendMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      removeErrorMessages: () =>
        set((s) => ({ messages: s.messages.filter((m) => !m.isError) })),

      updateDiagram: (diagram) =>
        set({ diagram }),

      setPhase: (phase) =>
        set({ phase }),

      setIsSending: (v) =>
        set({ isSending: v }),

      setPendingComplete: (v) =>
        set({ pendingComplete: v }),

      toggleDiagram: () =>
        set((s) => ({ diagramVisible: !s.diagramVisible })),

      resetSession: () =>
        set({
          sessionId: null,
          diagram: null,
          phase: 'idle',
          messages: [],
          isSending: false,
          pendingComplete: false,
        }),
    }),
    {
      name: 'schemavis-session',
      storage: createJSONStorage(() => sessionStorage), // cleared on tab close
      // Only persist the minimum needed to restore session context on refresh.
      // Messages are NOT persisted — they're always re-fetched from the server
      // via useSessionDetail, which avoids stale-message flashes and keeps
      // sessionStorage small (avoids hitting the 5 MB limit on long sessions).
      partialize: (s) => ({
        sessionId: s.sessionId,
        diagram:   s.diagram,
        phase:     s.phase,
      }),
    },
  ),
)
