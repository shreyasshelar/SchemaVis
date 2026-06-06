import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon, FolderOpenIcon, FolderIcon, CheckCircle2Icon,
  PencilIcon, Trash2Icon, ChevronLeftIcon, ChevronDownIcon,
  ChevronRightIcon, DatabaseIcon, FolderPlusIcon, MessageSquarePlusIcon,
  FolderInputIcon,
} from 'lucide-react'
import {
  useFolderTree, useCreateFolder, useRenameFolder,
  useDeleteFolder, useMoveSession,
} from '@/hooks/useFolders'
import { useCreateSession, useDeleteSession, useRenameSession } from '@/hooks/useSession'
import { useAppStore } from '@/store/appStore'
import { Spinner } from '@/components/ui/Spinner'
import type { SessionSummary, FolderSummary } from '@/types/api'

interface Props {
  collapsed: boolean
  onToggle:  () => void
}

// ── "Move to folder" dropdown ────────────────────────────────────
function MoveToMenu({
  sessionId,
  currentProjectId,
  onClose,
}: {
  sessionId:        string
  currentProjectId: string | null
  onClose:          () => void
}) {
  const { data: tree } = useFolderTree()
  const moveSession    = useMoveSession()
  const menuRef        = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const moveTo = (projectId: string | null) => {
    moveSession.mutate({ sessionId, projectId })
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg bg-panel border border-brd shadow-lg py-1"
    >
      <p className="px-3 py-1 text-2xs text-muted uppercase tracking-wider">Move to</p>
      {tree?.folders
        .filter((f) => f.projectId !== currentProjectId)
        .map((f) => (
          <button
            key={f.projectId}
            onClick={(e) => { e.stopPropagation(); moveTo(f.projectId) }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sec hover:bg-surf hover:text-hi transition-colors text-left"
          >
            <FolderIcon size={11} className="text-acc/70 flex-none" />
            <span className="truncate">{f.name}</span>
          </button>
        ))}
      {currentProjectId && (
        <button
          onClick={(e) => { e.stopPropagation(); moveTo(null) }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sec hover:bg-surf hover:text-hi transition-colors text-left border-t border-brd/50"
        >
          <DatabaseIcon size={11} className="text-sec/60 flex-none" />
          <span>Ungrouped</span>
        </button>
      )}
      {(!tree || tree.folders.filter((f) => f.projectId !== currentProjectId).length === 0) && !currentProjectId && (
        <p className="px-3 py-1.5 text-2xs text-muted italic">No folders yet</p>
      )}
    </div>
  )
}

// ── Single session row ───────────────────────────────────────────
function SessionRow({
  session,
  indent = false,
}: {
  session: SessionSummary
  indent?: boolean
}) {
  const activeId       = useAppStore((s) => s.sessionId)
  const deleteSession  = useDeleteSession()
  const renameSession  = useRenameSession()
  const [editName, setEditName] = useState(session.name)
  const [editing,  setEditing]  = useState(false)
  const [showMove, setShowMove] = useState(false)

  const isActive = session.sessionId === activeId

  const commitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== session.name) {
      renameSession.mutate({ sessionId: session.sessionId, name: trimmed })
    }
    setEditing(false)
  }

  const open = () => {
    if (isActive) return
    useAppStore.setState({
      sessionId:       session.sessionId,
      messages:        [],
      isSending:       false,
      pendingComplete: false,
      phase:           'chatting',
      // Intentionally NOT clearing diagram here — keep the previous diagram
      // visible until useSessionDetail loads the new session's diagram.
      // This prevents a jarring flash to EmptyDiagram during the fetch.
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      className={[
        'group relative flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer',
        'transition-colors text-sm select-none',
        indent ? 'ml-3' : '',
        isActive ? 'bg-acc/15 text-hi' : 'text-sec hover:bg-surf hover:text-hi',
      ].join(' ')}
      onClick={open}
    >
      <div className="flex-none">
        {isActive
          ? <FolderOpenIcon size={13} className="text-acc" />
          : <DatabaseIcon   size={13} />}
      </div>

      {editing ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') { setEditName(session.name); setEditing(false) }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent border-b border-acc/60 outline-none text-hi text-sm"
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-xs leading-snug">{session.name}</span>
      )}

      {session.complete && (
        <CheckCircle2Icon size={11} className="text-ok flex-none opacity-70" />
      )}

      <div className="hidden group-hover:flex items-center gap-0.5 absolute right-1 bg-panel rounded px-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); setEditName(session.name); setEditing(true) }}
          className="p-0.5 rounded hover:bg-surf text-sec hover:text-hi"
          title="Rename chat"
        >
          <PencilIcon size={10} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMove(true) }}
          className="p-0.5 rounded hover:bg-acc/20 text-sec hover:text-acc"
          title="Move to folder"
        >
          <FolderInputIcon size={10} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${session.name}"?`)) deleteSession.mutate(session.sessionId) }}
          className="p-0.5 rounded hover:bg-red-500/20 text-sec hover:text-red-400"
          title="Delete chat"
        >
          <Trash2Icon size={10} />
        </button>
      </div>

      {/* Move-to-folder dropdown */}
      {showMove && (
        <MoveToMenu
          sessionId={session.sessionId}
          currentProjectId={session.projectId}
          onClose={() => setShowMove(false)}
        />
      )}
    </motion.div>
  )
}

// ── Folder row with its sessions ─────────────────────────────────
function FolderRow({ folder }: { folder: FolderSummary }) {
  const [open,        setOpen]     = useState(true)
  const [editing,     setEditing]  = useState(false)
  const [editName,    setEditName] = useState(folder.name)
  const renameFolder = useRenameFolder()
  const deleteFolder = useDeleteFolder()
  const createSession = useCreateSession()

  const commitRename = () => {
    if (editName.trim() && editName.trim() !== folder.name) {
      renameFolder.mutate({ projectId: folder.projectId, name: editName.trim() })
    }
    setEditing(false)
  }

  const handleNewChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    createSession.mutate({ name: 'New Schema', projectId: folder.projectId })
  }

  return (
    <div>
      {/* Folder header */}
      <div
        className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer
                   text-sec hover:bg-surf hover:text-hi transition-colors select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex-none text-sec/60">
          {open ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        </span>
        <FolderIcon size={13} className="flex-none text-acc/70" />

        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent border-b border-acc/60 outline-none text-hi text-sm"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs font-semibold">
            {folder.name}
          </span>
        )}

        <span className="text-2xs text-muted ml-auto flex-none">
          {folder.sessions.length}
        </span>

        {/* Folder actions — show on hover */}
        <div className="hidden group-hover:flex items-center gap-0.5 ml-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleNewChat(e) }}
            className="p-0.5 rounded hover:bg-acc/20 text-sec hover:text-acc"
            title="New chat in this folder"
          >
            <MessageSquarePlusIcon size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditName(folder.name); setEditing(true) }}
            className="p-0.5 rounded hover:bg-surf text-sec hover:text-hi"
            title="Rename folder"
          >
            <PencilIcon size={10} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Delete folder "${folder.name}"? Sessions inside will become ungrouped.`)) {
                deleteFolder.mutate(folder.projectId)
              }
            }}
            className="p-0.5 rounded hover:bg-red-500/20 text-sec hover:text-red-400"
            title="Delete folder"
          >
            <Trash2Icon size={10} />
          </button>
        </div>
      </div>

      {/* Sessions inside folder */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-1 border-l border-brd/50 pl-1 mt-0.5 space-y-0.5">
              {folder.sessions.length === 0 ? (
                <p className="text-2xs text-muted px-2 py-1.5 italic">No chats yet</p>
              ) : (
                <AnimatePresence initial={false}>
                  {folder.sessions.map((s) => (
                    <SessionRow key={s.sessionId} session={s} indent />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main sidebar ─────────────────────────────────────────────────
export function ProjectsSidebar({ collapsed, onToggle }: Props) {
  const { data: tree, isLoading } = useFolderTree()
  const createSession  = useCreateSession()
  const createFolder   = useCreateFolder()

  const handleNewChat = () => {
    createSession.mutate({ name: 'New Schema' })
  }

  const handleNewFolder = () => {
    createFolder.mutate('New Folder')
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity ${
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={onToggle}
      />

      <div
        className={`
          flex-none flex flex-col border-r border-brd bg-panel/95 backdrop-blur-sm
          transition-all duration-300 overflow-hidden
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto h-full
          ${collapsed
            ? '-translate-x-full md:translate-x-0 w-56 md:w-12'
            : 'translate-x-0 w-56'}
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

        {/* Action buttons */}
        {!collapsed && (
          <div className="px-2 py-2 border-b border-brd flex gap-1 flex-none">
            <button
              onClick={handleNewChat}
              disabled={createSession.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5
                         text-acc hover:bg-acc/10 transition-colors text-xs font-medium
                         disabled:opacity-50"
              title="New chat (ungrouped)"
            >
              {createSession.isPending
                ? <Spinner size={12} className="text-acc" />
                : <PlusIcon size={12} />}
              New chat
            </button>
            <button
              onClick={handleNewFolder}
              disabled={createFolder.isPending}
              className="flex items-center justify-center gap-1 rounded-lg px-2 py-1.5
                         text-sec hover:bg-surf hover:text-hi transition-colors text-xs
                         disabled:opacity-50"
              title="New folder"
            >
              {createFolder.isPending
                ? <Spinner size={12} className="text-sec" />
                : <FolderPlusIcon size={12} />}
            </button>
          </div>
        )}

        {/* Collapsed: just icons */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1 py-2 border-b border-brd flex-none">
            <button
              onClick={handleNewChat}
              disabled={createSession.isPending}
              className="p-1.5 rounded hover:bg-acc/10 text-acc transition-colors"
              title="New chat"
            >
              <PlusIcon size={14} />
            </button>
          </div>
        )}

        {/* Tree */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {isLoading && (
              <div className="flex justify-center pt-4">
                <Spinner size={16} className="text-sec" />
              </div>
            )}

            {/* Folders */}
            {tree?.folders.map((folder) => (
              <FolderRow key={folder.projectId} folder={folder} />
            ))}

            {/* Divider if both sections have content */}
            {tree && tree.folders.length > 0 && tree.ungrouped.length > 0 && (
              <div className="border-t border-brd/50 my-1" />
            )}

            {/* Ungrouped sessions */}
            {tree && tree.ungrouped.length > 0 && (
              <div>
                {tree.folders.length > 0 && (
                  <p className="text-2xs text-muted uppercase tracking-wider px-2 mb-1">
                    Ungrouped
                  </p>
                )}
                <AnimatePresence initial={false}>
                  {tree.ungrouped.map((s) => (
                    <SessionRow key={s.sessionId} session={s} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && tree && tree.folders.length === 0 && tree.ungrouped.length === 0 && (
              <div className="text-center pt-6 px-3">
                <DatabaseIcon size={24} className="text-sec/40 mx-auto mb-2" />
                <p className="text-xs text-sec/60">No projects yet</p>
                <p className="text-xs text-sec/40 mt-1">
                  Click <strong className="text-sec/60">New chat</strong> or create a folder
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
