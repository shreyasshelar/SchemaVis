import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XIcon } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSessionDetail, useMarkComplete } from '@/hooks/useSession'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { Spinner } from '@/components/ui/Spinner'

// ── Schema-complete approval banner ──────────────────────────────
// Shown when the AI signals [COMPLETE] but user hasn't approved yet.
// Only "Mark complete" persists schemaComplete=true to the backend.
function CompleteApprovalBanner() {
  const { sessionId, pendingComplete, setPendingComplete, setPhase } = useAppStore()
  const markComplete = useMarkComplete()

  const approve = () => {
    if (!sessionId) return
    markComplete.mutate({ sessionId, complete: true }, {
      onSuccess: () => {
        setPhase('complete')
        setPendingComplete(false)
      },
    })
  }
  const dismiss = () => {
    setPendingComplete(false)
  }

  return (
    <AnimatePresence>
      {pendingComplete && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="mx-4 mt-2 p-3 rounded-xl bg-ok/10 border border-ok/30 flex flex-col gap-2.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon size={14} className="text-ok flex-none" />
              <p className="text-sm font-semibold text-hi">Schema looks complete</p>
            </div>
            <button
              onClick={dismiss}
              className="p-0.5 rounded text-sec hover:text-hi transition-colors"
              aria-label="Dismiss"
            >
              <XIcon size={13} />
            </button>
          </div>

          <p className="text-xs text-sec leading-relaxed">
            The AI thinks all tables and relationships are defined. Mark as complete to lock
            the schema badge, or keep refining — you can always continue chatting either way.
          </p>

          <div className="flex gap-2">
            <button
              onClick={approve}
              disabled={markComplete.isPending}
              className="flex-1 h-7 rounded-lg bg-ok/20 border border-ok/35 text-xs text-ok
                         font-medium hover:bg-ok/30 transition-colors disabled:opacity-60"
            >
              {markComplete.isPending ? '…' : '✓ Mark complete'}
            </button>
            <button
              onClick={dismiss}
              className="flex-1 h-7 rounded-lg bg-surf border border-brd text-xs text-sec
                         hover:text-hi transition-colors"
            >
              Keep refining
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Panel ─────────────────────────────────────────────────────────
export function ChatPanel() {
  const { phase, sessionId } = useAppStore()
  // Always call before any early return — restores messages + diagram on project switch
  const { isLoading, isError } = useSessionDetail(sessionId)

  if (phase === 'idle') {
    return (
      <div className="flex-1 overflow-hidden">
        <WelcomeScreen />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size={20} className="text-sec" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-sm text-err">Failed to load session</p>
        <p className="text-xs text-muted">Check your connection and refresh the page</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CompleteApprovalBanner />
      <MessageList />
      <ChatInput />
    </div>
  )
}
