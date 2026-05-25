import { motion } from 'framer-motion'

// Three animated dots with staggered bounce — Framer Motion spring.
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 self-start">
      <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-aiBg border border-brd">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-sec"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.18,
            }}
          />
        ))}
      </div>
    </div>
  )
}
