import { memo } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon } from 'lucide-react'
import type { MessageDto } from '@/types/api'

interface MessageBubbleProps {
  message: MessageDto
}

// Messages animate in with a fast fade-up slide.
// User bubbles — right-aligned, violet tint.
// Assistant bubbles — left-aligned, near-black with subtle border.
export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`flex gap-2.5 px-4 py-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-acc/15 border border-acc/25 flex items-center justify-center flex-none mt-0.5">
          <SparklesIcon size={13} className="text-acc" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={[
          'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-uBg border border-acc/20 text-hi rounded-tr-sm'
            : 'bg-aiBg border border-brd text-hi rounded-tl-sm',
        ].join(' ')}
      >
        {/* Render newlines as line breaks */}
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={line === '' ? 'h-3' : ''}>
            {line}
          </p>
        ))}

        <time className="block mt-1.5 text-2xs text-muted text-right">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
    </motion.div>
  )
})
