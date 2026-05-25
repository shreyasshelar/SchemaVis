import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Tooltip } from './Tooltip'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: 'ghost' | 'glass'
  size?: 'sm' | 'md'
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  tooltipSide = 'top',
  className = '',
  ...props
}: IconButtonProps) {
  const base = [
    'inline-flex items-center justify-center rounded-md transition-colors',
    'disabled:opacity-40 disabled:pointer-events-none',
    size === 'sm' ? 'w-7 h-7' : 'w-8 h-8',
    variant === 'glass'
      ? 'bg-surf/60 border border-brd hover:bg-surf hover:border-brdLt'
      : 'text-sec hover:text-hi hover:bg-surf/80',
    className,
  ].join(' ')

  return (
    <Tooltip label={label} side={tooltipSide}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        className={base}
        aria-label={label}
        {...(props as object)}
      >
        {icon}
      </motion.button>
    </Tooltip>
  )
}
