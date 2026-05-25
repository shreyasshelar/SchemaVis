import { useState, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface TooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const variants = {
    hidden:  { opacity: 0, scale: 0.92, y: side === 'top' ? 4 : side === 'bottom' ? -4 : 0 },
    visible: { opacity: 1, scale: 1,    y: 0 },
  }

  const pos: Record<string, string> = {
    top:    'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left:   'right-full mr-2 top-1/2 -translate-y-1/2',
    right:  'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={{ duration: 0.12 }}
            className={`pointer-events-none absolute z-50 ${pos[side]}`}
          >
            <span className="whitespace-nowrap rounded-md bg-surf border border-brd px-2.5 py-1 text-xs text-hi shadow-md">
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
