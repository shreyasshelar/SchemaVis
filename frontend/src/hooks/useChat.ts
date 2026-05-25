import { useMutation } from '@tanstack/react-query'
import { messagesApi } from '@/api/messages'
import { useAppStore } from '@/store/appStore'
import type { MessageDto } from '@/types/api'

export function useChat() {
  const { sessionId, appendMessage, updateDiagram, setPhase, setIsSending } =
    useAppStore()

  return useMutation({
    mutationFn: (content: string) => {
      if (!sessionId) throw new Error('No active session')
      return messagesApi.send(sessionId, { content })
    },

    onMutate: (content) => {
      setIsSending(true)
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
      if (data.complete) setPhase('complete')
    },

    onSettled: () => {
      setIsSending(false)
    },
  })
}
