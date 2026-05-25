import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '@/api/sessions'
import { useAppStore } from '@/store/appStore'
import type { NewSessionRequest, MessageDto } from '@/types/api'

// ── Keys ─────────────────────────────────────────────────────────
export const sessionKeys = {
  all:    ['sessions'] as const,
  detail: (id: string) => ['sessions', id] as const,
}

// ── Create session ────────────────────────────────────────────────
export function useCreateSession() {
  const { startSession, setPhase } = useAppStore()

  return useMutation({
    mutationFn: (req: NewSessionRequest) => sessionsApi.create(req),
    onSuccess: (data) => {
      const firstMsg: MessageDto = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        createdAt: new Date().toISOString(),
      }
      startSession(data.sessionId, firstMsg, data.diagram)
      if (data.complete) setPhase('complete')
    },
  })
}

// ── Fetch session detail (used to rehydrate on refresh) ───────────
// Note: TanStack Query v5 removed onSuccess from useQuery options.
// Side-effects on query data are handled via useEffect instead.
export function useSessionDetail(sessionId: string | null) {
  const { startSession, updateDiagram, setPhase, messages } = useAppStore()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: sessionKeys.detail(sessionId ?? ''),
    queryFn: () => sessionsApi.get(sessionId!),
    enabled: !!sessionId && messages.length === 0, // skip if store already populated
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!query.data) return
    const data = query.data
    const msgs = data.messages.map((m) => ({
      ...m,
      role: m.role as 'user' | 'assistant',
    }))
    if (msgs.length > 0) {
      startSession(data.sessionId, msgs[0], data.currentDiagram)
      msgs.slice(1).forEach((m) => useAppStore.getState().appendMessage(m))
      if (data.currentDiagram) updateDiagram(data.currentDiagram)
      if (data.complete) setPhase('complete')
    }
    qc.setQueryData(sessionKeys.detail(sessionId!), data)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])

  return query
}

// ── Delete session ────────────────────────────────────────────────
export function useDeleteSession() {
  const { resetSession } = useAppStore()

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.remove(sessionId),
    onSuccess: () => resetSession(),
  })
}
