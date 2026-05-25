import { type ReactNode, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
}

// Draggable split pane — chat left, diagram right.
// Respects `diagramVisible` from store to animate out the right pane.
export function SplitPane({ left, right }: SplitPaneProps) {
  const { diagramVisible } = useAppStore()
  const [leftPct, setLeftPct] = useState(42)   // percent width for chat side
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100))
      setLeftPct(pct)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* ── Chat panel ────────────────────────────────────────── */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: diagramVisible ? `${leftPct}%` : '100%', transition: 'width 0.25s ease' }}
      >
        {left}
      </div>

      {/* ── Resize handle ────────────────────────────────────── */}
      <AnimatePresence>
        {diagramVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={onMouseDown}
            className="w-px bg-brd hover:bg-acc/60 cursor-col-resize transition-colors relative group flex-none"
          >
            {/* Drag affordance dots */}
            <div className="absolute inset-y-0 -left-1.5 -right-1.5 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="w-1 h-1 rounded-full bg-acc/60" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Diagram panel ────────────────────────────────────── */}
      <AnimatePresence>
        {diagramVisible && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col overflow-hidden flex-1"
          >
            {right}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
