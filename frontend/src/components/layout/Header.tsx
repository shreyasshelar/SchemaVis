import { motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { useDeleteSession } from '@/hooks/useSession'
import { IconButton } from '@/components/ui/IconButton'
import { Spinner } from '@/components/ui/Spinner'
import {
  PlusIcon,
  LayoutPanelLeftIcon,
  CheckCircleIcon,
  DatabaseIcon,
} from 'lucide-react'

export function Header() {
  const { phase, sessionId, diagramVisible, toggleDiagram } = useAppStore()
  const deleteSession = useDeleteSession()

  const handleNewSession = () => {
    if (!sessionId) return
    deleteSession.mutate(sessionId)
  }

  return (
    <header className="flex-none h-12 flex items-center justify-between px-4 border-b border-brd bg-panel/90 backdrop-blur-md z-10">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0,   scale: 1 }}
          className="w-7 h-7 rounded-lg bg-acc/20 border border-acc/40 flex items-center justify-center"
        >
          <DatabaseIcon size={14} className="text-acc" />
        </motion.div>
        <span className="font-semibold text-md text-hi tracking-tight">
          Schema<span className="text-acc">Vis</span>
        </span>
      </div>

      {/* ── Status pill ──────────────────────────────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ok/10 border border-ok/30"
          >
            <CheckCircleIcon size={12} className="text-ok" />
            <span className="text-xs text-ok font-medium">Schema complete</span>
          </motion.div>
        )}
        {phase === 'chatting' && (
          <span className="text-xs text-sec font-mono opacity-60">
            {sessionId?.slice(0, 8)}…
          </span>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={
            deleteSession.isPending
              ? <Spinner size={14} className="text-sec" />
              : <PlusIcon size={15} />
          }
          label="New session"
          tooltipSide="bottom"
          disabled={!sessionId || deleteSession.isPending}
          onClick={handleNewSession}
        />
        <IconButton
          icon={<LayoutPanelLeftIcon size={15} />}
          label={diagramVisible ? 'Hide diagram' : 'Show diagram'}
          tooltipSide="bottom"
          onClick={toggleDiagram}
          className={diagramVisible ? 'text-acc' : ''}
        />
      </div>
    </header>
  )
}
