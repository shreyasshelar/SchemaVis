import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '@/api/sessions'
import { useAppStore } from '@/store/appStore'
import { folderKeys } from '@/hooks/useFolders'
import type { NewSessionRequest, MessageDto } from '@/types/api'

// ── Keys ─────────────────────────────────────────────────────────
export const sessionKeys = {
  all:    ['sessions'] as const,
  detail: (id: string) => ['sessions', id] as const,
}

// ── Create session ────────────────────────────────────────────────
export function useCreateSession() {
  const { startSession, setPendingComplete } = useAppStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (req: NewSessionRequest) => sessionsApi.create(req),
    onSuccess: (data) => {
      const firstMsg: MessageDto = {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   data.message,
        createdAt: new Date().toISOString(),
      }
      startSession(data.sessionId, firstMsg, data.diagram)
      // Show approval banner instead of auto-locking — same as mid-chat complete
      if (data.complete) setPendingComplete(true)
      // Refresh the folder sidebar
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}

// ── Fetch session detail (rehydrate on project switch or page refresh) ──
export function useSessionDetail(sessionId: string | null) {
  const { startSession, updateDiagram, setPhase } = useAppStore()
  // Track which sessionId we've already restored so re-fetches don't overwrite active chat
  const restoredForRef = useRef<string | null>(null)

  const query = useQuery({
    queryKey: sessionKeys.detail(sessionId ?? ''),
    queryFn:  () => sessionsApi.get(sessionId!),
    enabled:   !!sessionId,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!query.data) return
    const data = query.data
    // Skip if we already restored this session (prevents overwriting in-progress chat)
    if (data.sessionId === restoredForRef.current) return
    restoredForRef.current = data.sessionId

    const msgs = data.messages.map((m) => ({
      ...m,
      role: m.role as 'user' | 'assistant',
    }))
    if (msgs.length > 0) {
      startSession(data.sessionId, msgs[0], data.currentDiagram)
      msgs.slice(1).forEach((m) => useAppStore.getState().appendMessage(m))
      if (data.currentDiagram) updateDiagram(data.currentDiagram)
      if (data.complete) setPhase('complete')
    } else {
      useAppStore.setState({ phase: 'chatting' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])

  return query
}

// ── Rename session ────────────────────────────────────────────────
export function useRenameSession() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, name }: { sessionId: string; name: string }) =>
      sessionsApi.rename(sessionId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}

// ── Delete session ────────────────────────────────────────────────
export function useDeleteSession() {
  const { resetSession } = useAppStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.remove(sessionId),
    onSuccess: () => {
      resetSession()
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}
