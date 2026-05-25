import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

export function MessageList() {
  const { messages, isSending } = useAppStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  return (
    <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5">
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isSending && <TypingIndicator key="typing" />}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
