import { memo } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon, NetworkIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react'
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

// ── Fenced code block renderer ───────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="my-2 rounded-lg overflow-hidden border border-brd/60 text-[0.75rem] font-mono">
      {lang && (
        <div className="px-3 py-1 bg-surf/60 border-b border-brd/40 text-muted text-[0.68rem] uppercase tracking-wide">
          {lang}
        </div>
      )}
      <pre className="px-3 py-2.5 overflow-x-auto bg-surf/30 text-sec leading-relaxed whitespace-pre">
        {code.trim()}
      </pre>
    </div>
  )
}

// ── Prose block renderer (lines within a non-code segment) ────────
function renderProse(text: string, keyPrefix: string): React.ReactNode[] {
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

    if (listBuffer.length > 0) flushList(`${keyPrefix}-list-${i}`)

    if (raw.trim() === '') {
      elements.push(<div key={`${keyPrefix}-gap-${i}`} className="h-2" />)
      continue
    }

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
        <p key={`${keyPrefix}-h-${i}`} className={cls}>
          {renderInline(headingMatch[2])}
        </p>,
      )
      continue
    }

    elements.push(
      <p key={`${keyPrefix}-p-${i}`} className="leading-relaxed">
        {renderInline(raw)}
      </p>,
    )
  }

  if (listBuffer.length > 0) flushList(`${keyPrefix}-list-end`)
  return elements
}

// ── Full markdown renderer ────────────────────────────────────────
// Handles: [DIAGRAM]...[/DIAGRAM], [COMPLETE], fenced code blocks,
// **bold**, `code`, - lists, * lists (nested), ### headings
function renderContent(content: string): React.ReactNode {
  // 1. Strip [DIAGRAM] and [COMPLETE] markers
  const hasDiagram = /\[DIAGRAM\][\s\S]*?\[\/DIAGRAM\]/i.test(content)
  const text = content
    .replace(/\[DIAGRAM\][\s\S]*?\[\/DIAGRAM\]/gi, '')
    .replace(/\[COMPLETE\]/gi, '')
    .replace(/\[\/COMPLETE\]/gi, '')
    .trim()

  // 2. Split on fenced code blocks (```lang\n...```)
  const fenceRe = /^```(\w*)\n([\s\S]*?)^```/gm
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let blockIdx = 0
  let match: RegExpExecArray | null

  while ((match = fenceRe.exec(text)) !== null) {
    // Prose before this code block
    const prose = text.slice(lastIndex, match.index)
    if (prose.trim()) {
      elements.push(...renderProse(prose, `prose-${blockIdx}`))
    }
    // Code block
    elements.push(<CodeBlock key={`code-${blockIdx}`} lang={match[1]} code={match[2]} />)
    lastIndex = match.index + match[0].length
    blockIdx++
  }

  // Remaining prose after last code block
  const tail = text.slice(lastIndex)
  if (tail.trim()) {
    elements.push(...renderProse(tail, `prose-${blockIdx}`))
  }

  // 3. Diagram badge
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
        <div className={[
          'w-7 h-7 rounded-lg flex items-center justify-center flex-none mt-0.5 border',
          message.isError
            ? 'bg-err/15 border-err/30'
            : 'bg-acc/15 border-acc/25',
        ].join(' ')}>
          {message.isError
            ? <AlertCircleIcon size={13} className="text-err" />
            : <SparklesIcon size={13} className="text-acc" />}
        </div>
      )}

      {/* Bubble */}
      <div
        className={[
          'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-uBg border border-acc/20 text-hi rounded-tr-sm'
            : message.isError
              ? 'bg-err/8 border border-err/25 text-hi rounded-tl-sm'
              : 'bg-aiBg border border-brd text-hi rounded-tl-sm',
        ].join(' ')}
      >
        {message.isError ? (
          <div className="flex items-center gap-2 text-err/90">
            <RefreshCwIcon size={12} className="flex-none" />
            <span>{message.content}</span>
          </div>
        ) : (
          renderContent(message.content)
        )}

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
