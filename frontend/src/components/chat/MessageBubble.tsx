import { memo } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon, NetworkIcon } from 'lucide-react'
import type { MessageDto } from '@/types/api'

// ── Inline renderer: **bold**, `code` ────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-hi">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-surf/80 border border-brd/60 font-mono text-[0.7rem] text-acc"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// ── Full markdown renderer ────────────────────────────────────────
// Handles: [DIAGRAM]...[/DIAGRAM] blocks, [COMPLETE], **bold**,
// `code`, - lists, * lists (nested), ### headings
function renderContent(content: string): React.ReactNode {
  // 1. Detect & strip [DIAGRAM]...[/DIAGRAM] blocks
  const hasDiagram = /\[DIAGRAM\][\s\S]*?\[\/DIAGRAM\]/i.test(content)
  let text = content
    .replace(/\[DIAGRAM\][\s\S]*?\[\/DIAGRAM\]/gi, '')
    .replace(/\[COMPLETE\]/gi, '')
    .replace(/\[\/COMPLETE\]/gi, '')
    .trim()

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listBuffer: Array<{ indent: number; text: string }> = []

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return
    elements.push(
      <ul key={key} className="list-disc list-inside space-y-0.5 my-1 pl-1 text-sec">
        {listBuffer.map((item, i) => (
          <li
            key={i}
            className="text-[0.82rem] leading-relaxed"
            style={{ marginLeft: item.indent * 12 }}
          >
            {renderInline(item.text)}
          </li>
        ))}
      </ul>,
    )
    listBuffer = []
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const listMatch = raw.match(/^(\s*)[-*]\s+(.+)$/)

    if (listMatch) {
      listBuffer.push({ indent: Math.floor(listMatch[1].length / 2), text: listMatch[2] })
      continue
    }

    if (listBuffer.length > 0) flushList(`list-${i}`)

    if (raw.trim() === '') {
      elements.push(<div key={`gap-${i}`} className="h-2" />)
      continue
    }

    // Headings
    const headingMatch = raw.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const cls =
        level === 1
          ? 'font-bold text-sm text-hi mt-2 mb-0.5'
          : level === 2
            ? 'font-semibold text-[0.82rem] text-hi mt-1.5 mb-0.5'
            : 'font-semibold text-[0.78rem] text-hi/80 mt-1 mb-0.5 uppercase tracking-wide'
      elements.push(
        <p key={i} className={cls}>
          {renderInline(headingMatch[2])}
        </p>,
      )
      continue
    }

    // Normal line
    elements.push(
      <p key={i} className="leading-relaxed">
        {renderInline(raw)}
      </p>,
    )
  }

  if (listBuffer.length > 0) flushList('list-end')

  // Diagram badge at the bottom
  if (hasDiagram) {
    elements.push(
      <div
        key="diagram-badge"
        className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 rounded-lg bg-acc/10 border border-acc/20 text-xs text-acc"
      >
        <NetworkIcon size={11} className="flex-none" />
        <span>Diagram updated in canvas →</span>
      </div>,
    )
  }

  return elements
}

// ── Component ─────────────────────────────────────────────────────
interface MessageBubbleProps {
  message: MessageDto
}

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
        {isUser
          ? // User messages: plain text with line breaks
            message.content.split('\n').map((line, i) => (
              <p key={i} className={line === '' ? 'h-3' : ''}>
                {line}
              </p>
            ))
          : // AI messages: full markdown render
            renderContent(message.content)}

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
