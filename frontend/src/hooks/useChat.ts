import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/api/messages'
import { useAppStore } from '@/store/appStore'
import { sessionKeys } from '@/hooks/useSession'
import type { MessageDto } from '@/types/api'

export function useChat() {
  const {
    sessionId, phase,
    appendMessage, removeErrorMessages, updateDiagram,
    setPhase, setIsSending, setPendingComplete,
  } = useAppStore()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => {
      if (!sessionId) throw new Error('No active session')
      return messagesApi.send(sessionId, { content })
    },

    onMutate: async (content) => {
      // Cancel any in-flight session detail refetch so it can't overwrite
      // the optimistic user message with stale server data.
      if (sessionId) {
        await qc.cancelQueries({ queryKey: sessionKeys.detail(sessionId) })
      }

      setIsSending(true)

      // Clear any leftover error bubbles so a retry starts clean.
      removeErrorMessages()

      // If the schema was previously marked complete and the user sends a new
      // message, revert to 'chatting' — they want to keep refining.
      if (phase === 'complete') setPhase('chatting')
      // Dismiss any pending-complete banner left over from a previous response.
      setPendingComplete(false)

      // Optimistically show the user's message immediately.
      appendMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      })

      // Return the session this mutation was fired for so callbacks can
      // guard against stale results landing in a different session.
      return { mutationSessionId: sessionId }
    },

    onSuccess: (data, _content, context) => {
      // Discard if the user switched sessions before the response arrived.
      if (useAppStore.getState().sessionId !== context?.mutationSessionId) return

      const assistantMsg: MessageDto = {
        id: data.messageId,
        role: 'assistant',
        content: data.content,
        createdAt: new Date().toISOString(),
      }
      appendMessage(assistantMsg)

      if (data.diagram) updateDiagram(data.diagram)
      // Don't auto-complete — show approval banner instead so user decides
      if (data.complete) setPendingComplete(true)
    },

    onError: (_err, _content, context) => {
      // Discard if the user switched sessions before the error arrived.
      if (useAppStore.getState().sessionId !== context?.mutationSessionId) return

      appendMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong — please try again.',
        createdAt: new Date().toISOString(),
        isError: true,
      })
    },

    onSettled: () => {
      setIsSending(false)
    },
  })
}
