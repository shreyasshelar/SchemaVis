import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon, FolderOpenIcon, FolderIcon, CheckCircle2Icon,
  PencilIcon, Trash2Icon, ChevronLeftIcon, DatabaseIcon,
} from 'lucide-react'
import { useProjects, useDeleteProject, useRenameProject } from '@/hooks/useProjects'
import { useCreateSession } from '@/hooks/useSession'
import { useAppStore } from '@/store/appStore'
import { Spinner } from '@/components/ui/Spinner'
import type { SessionSummary } from '@/types/api'

interface Props {
  collapsed: boolean
  onToggle:  () => void
}

export function ProjectsSidebar({ collapsed, onToggle }: Props) {
  const { data: projects, isLoading } = useProjects()
  const createSession = useCreateSession()
  const deleteProject = useDeleteProject()
  const renameProject = useRenameProject()
  const activeId      = useAppStore((s) => s.sessionId)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName,  setEditName]  = useState('')

  const handleNew = () => {
    createSession.mutate({ name: 'New Schema' })
  }

  const startRename = (p: SessionSummary) => {
    setEditingId(p.sessionId)
    setEditName(p.name)
  }

  const commitRename = (sessionId: string) => {
    if (editName.trim()) renameProject.mutate({ sessionId, name: editName.trim() })
    setEditingId(null)
  }

  /** Open a project: reset store with the chosen session id; useSessionDetail will reload history */
  const handleOpen = (p: SessionSummary) => {
    if (p.sessionId === activeId) return
    useAppStore.setState({ sessionId: p.sessionId, messages: [], diagram: null, phase: 'chatting' })
  }

  return (
    <div
      className={`
        flex-none flex flex-col border-r border-brd bg-panel/60 backdrop-blur-sm
        transition-all duration-300 overflow-hidden
        ${collapsed ? 'w-12' : 'w-56'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-brd flex-none">
        {!collapsed && (
          <span className="text-xs font-semibold text-sec uppercase tracking-wider">
            Projects
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded hover:bg-surf text-sec hover:text-hi transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeftIcon
            size={14}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* New project */}
      <div className="px-2 py-2 border-b border-brd flex-none">
        <button
          onClick={handleNew}
          disabled={createSession.isPending}
          className="w-full flex items-center gap-2 rounded-lg px-2 py-2
                     text-acc hover:bg-acc/10 transition-colors text-sm font-medium
                     disabled:opacity-50"
          title="New project"
        >
          {createSession.isPending
            ? <Spinner size={14} className="text-acc" />
            : <PlusIcon size={14} />}
          {!collapsed && <span>New project</span>}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-1.5">
        {isLoading && (
          <div className="flex justify-center pt-4">
            <Spinner size={16} className="text-sec" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {projects?.map((p) => (
            <motion.div
              key={p.sessionId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className={`
                group relative flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer
                transition-colors text-sm select-none
                ${p.sessionId === activeId
                  ? 'bg-acc/15 text-hi'
                  : 'text-sec hover:bg-surf hover:text-hi'}
              `}
              onClick={() => handleOpen(p)}
            >
              <div className="flex-none">
                {p.sessionId === activeId
                  ? <FolderOpenIcon size={14} className="text-acc" />
                  : <FolderIcon size={14} />}
              </div>

              {!collapsed && (
                <>
                  {editingId === p.sessionId ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => commitRename(p.sessionId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')  commitRename(p.sessionId)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-transparent border-b border-acc/60
                                 outline-none text-hi text-sm"
                    />
                  ) : (
                    <span className="flex-1 min-w-0 truncate text-sm leading-snug">
                      {p.name}
                    </span>
                  )}

                  {p.complete && (
                    <CheckCircle2Icon size={12} className="text-ok flex-none opacity-70" />
                  )}

                  {editingId !== p.sessionId && (
                    <div className="hidden group-hover:flex items-center gap-0.5 absolute right-1.5 bg-panel rounded">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(p) }}
                        className="p-0.5 rounded hover:bg-surf text-sec hover:text-hi"
                        title="Rename"
                      >
                        <PencilIcon size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Delete "${p.name}"?`)) deleteProject.mutate(p.sessionId)
                        }}
                        className="p-0.5 rounded hover:bg-red-500/20 text-sec hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2Icon size={11} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && !projects?.length && !collapsed && (
          <div className="text-center pt-6 px-3">
            <DatabaseIcon size={24} className="text-sec/40 mx-auto mb-2" />
            <p className="text-xs text-sec/60">No projects yet</p>
            <p className="text-xs text-sec/40 mt-1">Click + to create one</p>
          </div>
        )}
      </div>
    </div>
  )
}
