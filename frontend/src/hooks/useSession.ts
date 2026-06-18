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

  // Tracks the last sessionId we successfully restored into the store.
  // Guards against background refetches overwriting in-progress chat for the
  // CURRENT session, while still allowing re-restoration when the user
  // switches to a different session (including switching back to a cached one).
  const restoredForRef = useRef<string | null>(null)

  // Detect session switches during render and reset the guard so the next
  // data arrival (even from cache) always restores the new session.
  // This is the safe "derived state during render" pattern (React docs).
  const prevSessionIdRef = useRef<string | null>(null)
  if (prevSessionIdRef.current !== sessionId) {
    prevSessionIdRef.current = sessionId
    restoredForRef.current = null
  }

  const query = useQuery({
    queryKey:           sessionKeys.detail(sessionId ?? ''),
    queryFn:            () => sessionsApi.get(sessionId!),
    enabled:            !!sessionId,
    staleTime:          30_000,
    refetchOnWindowFocus: false,   // never clobber optimistic messages on focus
  })

  useEffect(() => {
    if (!query.data) return
    const data = query.data
    // Skip background refetches for the already-restored session so they
    // don't overwrite optimistic messages mid-chat.
    // NOTE: restoredForRef is reset to null above whenever sessionId changes,
    // so this guard never blocks a genuine session switch.
    if (data.sessionId === restoredForRef.current) return

    // Also skip if a message send is in flight — cancelQueries in useChat
    // should prevent this, but guard defensively.
    if (useAppStore.getState().isSending) return
    restoredForRef.current = data.sessionId

    // Deduplicate server messages by content+role+minute — guards against DB
    // duplicates created by old buggy restoration code that re-sent messages.
    const seen = new Set<string>()
    const msgs = data.messages
      .map((m) => ({ ...m, role: m.role as 'user' | 'assistant' }))
      .filter((m) => {
        const key = `${m.role}:${(m.content ?? '').substring(0, 80)}:${new Date(m.createdAt).toISOString().substring(0, 16)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    if (msgs.length > 0) {
      startSession(data.sessionId, msgs[0], data.currentDiagram)
      msgs.slice(1).forEach((m) => useAppStore.getState().appendMessage(m))
      if (data.currentDiagram) updateDiagram(data.currentDiagram)
      if (data.complete) setPhase('complete')
    } else {
      useAppStore.setState({ phase: 'chatting' })
    }
  // sessionId in deps: re-runs the effect whenever the session changes, even
  // when query.data is the same cached reference (fixes the "blank chat on
  // second switch" bug where React Query returns a cached object unchanged).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, sessionId])

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

// ── Mark schema complete (user-confirmed) ─────────────────────────
// Only called from the CompleteApprovalBanner when user clicks "Mark complete".
// Persists schemaComplete=true to the server and refreshes the sidebar badge.
export function useMarkComplete() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, complete }: { sessionId: string; complete?: boolean }) =>
      sessionsApi.markComplete(sessionId, complete),
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
    onSuccess: (_data, deletedSessionId) => {
      // Only clear the UI if the deleted session was the one being viewed.
      if (useAppStore.getState().sessionId === deletedSessionId) resetSession()
      qc.invalidateQueries({ queryKey: folderKeys.tree })
    },
  })
}
