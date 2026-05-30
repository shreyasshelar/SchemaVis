import {
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { motion } from 'framer-motion'
import { SendHorizonalIcon } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useAppStore } from '@/store/appStore'
import { Spinner } from '@/components/ui/Spinner'

const MAX_ROWS = 6
const LINE_HEIGHT = 20 // matches globals.css line-height for base

export function ChatInput() {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isSending, phase } = useAppStore()
  const chat = useChat()
  const isComplete = phase === 'complete'
  const locked = false  // never lock — allow refining after complete

  // Auto-resize textarea up to MAX_ROWS
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, LINE_HEIGHT * MAX_ROWS + 24)}px`
  }, [])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    resize()
  }

  const submit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isSending || locked) return
    chat.mutate(trimmed)
    setText('')
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, isSending, locked, chat])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = text.trim().length > 0 && !isSending && !locked

  return (
    <div className="flex-none px-4 pb-4 pt-2">
      <div
        className={[
          'flex items-end gap-2 rounded-xl border transition-colors',
          'bg-input',
          text.length > 0
            ? 'border-acc/40 ring-1 ring-acc/15'
            : 'border-brd hover:border-brdLt',
          locked ? 'opacity-50 pointer-events-none' : '',
        ].join(' ')}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            isComplete
              ? 'Schema complete — ask to refine, add tables, or change anything…'
              : 'Describe your schema, or ask a question…'
          }
          disabled={locked || isSending}
          className={[
            'flex-1 bg-transparent resize-none px-4 py-3 text-sm text-hi',
            'placeholder:text-muted focus:outline-none',
            'leading-5 min-h-[44px]',
          ].join(' ')}
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
        />

        {/* Send button */}
        <div className="flex-none pb-2 pr-2">
          <motion.button
            type="button"
            onClick={submit}
            disabled={!canSend}
            whileTap={{ scale: 0.88 }}
            animate={canSend ? { opacity: 1 } : { opacity: 0.35 }}
            className={[
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              canSend
                ? 'bg-acc hover:bg-accD text-white shadow-glow'
                : 'bg-surf text-muted',
            ].join(' ')}
          >
            {isSending
              ? <Spinner size={13} className="text-white" />
              : <SendHorizonalIcon size={14} />
            }
          </motion.button>
        </div>
      </div>

      <p className="mt-1.5 text-center text-2xs text-muted">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
