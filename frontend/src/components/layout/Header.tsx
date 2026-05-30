import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { IconButton } from '@/components/ui/IconButton'
import {
  LayoutPanelLeftIcon, CheckCircleIcon, DatabaseIcon,
  LogOutIcon, UserCircleIcon, BookOpenIcon, MenuIcon,
} from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { phase, diagramVisible, toggleDiagram } = useAppStore()
  const { user } = useAuthStore()
  const logout = useLogout()

  return (
    <header className="flex-none h-12 flex items-center gap-2 px-3 sm:px-4 border-b border-brd bg-panel/90 backdrop-blur-md z-10">
      {/* ── Mobile hamburger ──────────────────────────────────── */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-sec hover:text-hi hover:bg-surf transition-colors flex-none"
          aria-label="Toggle projects sidebar"
        >
          <MenuIcon size={16} />
        </button>
      )}

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-none">
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

      {/* ── Status pill — grows to fill center ───────────────── */}
      <div className="flex-1 flex justify-center">
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
      </div>

      {/* ── Right actions ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-none">
        <Link
          to="/docs"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sec hover:text-hi text-xs transition-colors"
        >
          <BookOpenIcon size={13} />
          <span>Docs</span>
        </Link>

        <IconButton
          icon={<LayoutPanelLeftIcon size={15} />}
          label={diagramVisible ? 'Hide diagram' : 'Show diagram'}
          tooltipSide="bottom"
          onClick={toggleDiagram}
          className={`hidden md:flex ${diagramVisible ? 'text-acc' : ''}`}
        />

        {user && (
          <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-brd">
            <div className="hidden sm:flex items-center gap-1.5 text-sec">
              <UserCircleIcon size={14} />
              <span className="text-xs max-w-[80px] truncate">
                {user.displayName}
              </span>
            </div>
            <IconButton
              icon={<LogOutIcon size={14} />}
              label="Sign out"
              tooltipSide="bottom"
              onClick={logout}
              className="text-sec hover:text-red-400"
            />
          </div>
        )}
      </div>
    </header>
  )
}
