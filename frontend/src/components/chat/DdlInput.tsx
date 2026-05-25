import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, CodeIcon } from 'lucide-react'

interface DdlInputProps {
  value: string
  onChange: (v: string) => void
}

// Collapsible SQL paste area shown above the first message.
// Animates open/close with spring physics for an elastic feel.
export function DdlInput({ value, onChange }: DdlInputProps) {
  const [open, setOpen] = useState(false)
  const hasContent = value.trim().length > 0

  return (
    <div className="border border-brd rounded-lg bg-surf/60 overflow-hidden">
      {/* ── Toggle row ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surf/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CodeIcon size={13} className={hasContent ? 'text-acc' : 'text-sec'} />
          <span className={`text-xs font-medium ${hasContent ? 'text-hi' : 'text-sec'}`}>
            {hasContent ? 'DDL attached' : 'Paste DDL (optional)'}
          </span>
          {hasContent && (
            <span className="px-1.5 py-0.5 rounded-full bg-acc/15 text-acc text-2xs font-mono">
              SQL
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <ChevronDownIcon size={13} className="text-sec" />
        </motion.div>
      </button>

      {/* ── Expandable editor ──────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ddl-area"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-brd p-2">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`-- Paste your CREATE TABLE statements here\nCREATE TABLE users (\n  id BIGINT PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL\n);`}
                rows={8}
                spellCheck={false}
                className={[
                  'w-full bg-input rounded-md px-3 py-2.5 text-xs font-mono text-hi',
                  'placeholder:text-muted resize-y border border-brd focus:border-acc/60',
                  'focus:outline-none focus:ring-1 focus:ring-acc/30 transition-colors',
                  'leading-relaxed',
                ].join(' ')}
              />
              <p className="mt-1.5 text-2xs text-muted">
                Skip this and just describe your schema in chat — the AI will guide you.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
