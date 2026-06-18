import { useMutation } from '@tanstack/react-query'
import { messagesApi } from '@/api/messages'
import { useAppStore } from '@/store/appStore'
import type { MessageDto } from '@/types/api'

export function useChat() {
  const {
    sessionId, phase,
    appendMessage, updateDiagram, setPhase, setIsSending, setPendingComplete,
  } = useAppStore()

  return useMutation({
    mutationFn: (content: string) => {
      if (!sessionId) throw new Error('No active session')
      return messagesApi.send(sessionId, { content })
    },

    onMutate: (content) => {
      setIsSending(true)

      // If the schema was previously marked complete and the user sends a new
      // message, revert to 'chatting' — they want to keep refining.
      // The "Schema complete" badge disappears immediately so there's no confusion.
      if (phase === 'complete') setPhase('chatting')
      // Also dismiss any pending-complete banner left over from a previous response.
      setPendingComplete(false)

      // Optimistically add user message
      const userMsg: MessageDto = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }
      appendMessage(userMsg)
    },

    onSuccess: (data) => {
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

    onError: () => {
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
