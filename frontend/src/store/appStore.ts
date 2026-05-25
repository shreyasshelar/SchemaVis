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

  // Actions
  startSession: (sessionId: string, firstMessage: MessageDto, diagram: string | null) => void
  appendMessage: (msg: MessageDto) => void
  updateDiagram: (diagram: string) => void
  setPhase: (phase: UIPhase) => void
  setIsSending: (v: boolean) => void
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

      startSession: (sessionId, firstMessage, diagram) =>
        set({
          sessionId,
          diagram,
          phase: 'chatting',
          messages: [firstMessage],
        }),

      appendMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      updateDiagram: (diagram) =>
        set({ diagram }),

      setPhase: (phase) =>
        set({ phase }),

      setIsSending: (v) =>
        set({ isSending: v }),

      toggleDiagram: () =>
        set((s) => ({ diagramVisible: !s.diagramVisible })),

      resetSession: () =>
        set({
          sessionId: null,
          diagram: null,
          phase: 'idle',
          messages: [],
          isSending: false,
        }),
    }),
    {
      name: 'schemavis-session',
      storage: createJSONStorage(() => sessionStorage), // cleared on tab close
      partialize: (s) => ({
        sessionId: s.sessionId,
        diagram: s.diagram,
        phase: s.phase,
        messages: s.messages,
      }),
    },
  ),
)
