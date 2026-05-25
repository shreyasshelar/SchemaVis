import { useState } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon, ArrowRightIcon } from 'lucide-react'
import { useCreateSession } from '@/hooks/useSession'
import { DdlInput } from './DdlInput'
import { Spinner } from '@/components/ui/Spinner'

const SUGGESTIONS = [
  'I have a multi-tenant SaaS with users, organisations, and subscriptions',
  'Build an e-commerce schema with products, orders, and inventory',
  'Design a blog platform with posts, comments, and tags',
  'Create a task manager with projects, tasks, and assignees',
]

export function WelcomeScreen() {
  const [ddl, setDdl] = useState('')
  const createSession = useCreateSession()

  const start = (prompt?: string) => {
    createSession.mutate({
      ddl: (prompt ?? ddl) || undefined,
    })
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-8">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center space-y-3 max-w-sm"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-acc/15 border border-acc/25 flex items-center justify-center mb-4">
          <SparklesIcon size={24} className="text-acc" />
        </div>
        <h1 className="text-2xl font-bold text-hi tracking-tight">
          Design your database schema
        </h1>
        <p className="text-sm text-sec leading-relaxed">
          Chat with AI to build, refine, and visualise your ER diagram — or paste your
          existing DDL to get started instantly.
        </p>
      </motion.div>

      {/* ── Input area ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-sm space-y-3"
      >
        <DdlInput value={ddl} onChange={setDdl} />

        <motion.button
          type="button"
          onClick={() => start()}
          disabled={createSession.isPending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-acc hover:bg-accD text-white font-medium text-sm
            shadow-glow transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          {createSession.isPending ? (
            <><Spinner size={15} className="text-white" /> Starting…</>
          ) : (
            <><SparklesIcon size={15} /> Start chatting <ArrowRightIcon size={13} /></>
          )}
        </motion.button>

        {createSession.isError && (
          <p className="text-xs text-err text-center">
            {(createSession.error as { friendlyMessage?: string })?.friendlyMessage ??
              'Failed to start. Please try again.'}
          </p>
        )}
      </motion.div>

      {/* ── Suggestion chips ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <p className="text-2xs text-muted text-center mb-2 uppercase tracking-wider">
          Try a suggestion
        </p>
        <div className="flex flex-col gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => start(s)}
              disabled={createSession.isPending}
              className="text-left text-xs text-sec hover:text-hi px-3 py-2
                rounded-lg bg-surf/50 border border-brd hover:border-brdLt
                transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
