import { useMemo, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { DatabaseIcon, RefreshCwIcon } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { parseMermaidErDiagram } from '@/lib/mermaidParser'
import { buildReactFlowGraph } from '@/lib/diagramLayout'
import { ERNode } from './ERNode'
import { EREdge } from './EREdge'
import type { ERNodeType } from './ERNode'
import type { EREdgeType } from './EREdge'

const NODE_TYPES = { erNode: ERNode } as const
const EDGE_TYPES = { erEdge: EREdge } as const

// ── Empty state ──────────────────────────────────────────────────
function EmptyDiagram() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-12 h-12 rounded-2xl bg-surf border border-brd flex items-center justify-center">
        <DatabaseIcon size={20} className="text-muted" />
      </div>
      <div>
        <p className="text-sm font-medium text-sec">No diagram yet</p>
        <p className="text-xs text-muted mt-1">
          Chat with the AI to start building your schema. The diagram will appear here as
          tables are defined.
        </p>
      </div>
    </div>
  )
}

// ── Re-layout button ─────────────────────────────────────────────
function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Reset positions and fit all tables in view"
      className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5
        rounded-lg bg-surf/80 border border-brd text-xs text-sec
        hover:text-hi hover:border-brdLt transition-colors backdrop-blur-sm"
    >
      <RefreshCwIcon size={12} />
      Re-layout
    </button>
  )
}

// ── Inner canvas ─────────────────────────────────────────────────
// Separated so useNodesState/useEdgesState are called without early returns.
// Uses onInit instance ref for fitView — more reliable than useReactFlow()
// which can connect to the wrong provider context in nested setups.
interface FlowCanvasProps {
  parsedNodes: ERNodeType[]
  parsedEdges: EREdgeType[]
}

function FlowCanvas({ parsedNodes, parsedEdges }: FlowCanvasProps) {
  const rfRef = useRef<ReactFlowInstance<ERNodeType, EREdgeType> | null>(null)
  const { diagram } = useAppStore()

  const [nodes, setNodes, onNodesChange] = useNodesState<ERNodeType>(parsedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<EREdgeType>(parsedEdges)

  // Sync whenever the diagram string changes (new AI response)
  useEffect(() => {
    setNodes(parsedNodes)
    setEdges(parsedEdges)
    // Small timeout ensures React has committed state before fitView measures nodes
    setTimeout(() => rfRef.current?.fitView({ padding: 0.2, duration: 300 }), 50)
  }, [parsedNodes, parsedEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge(connection, eds) as EREdgeType[]),
    [setEdges],
  )

  // Re-layout: recompute positions from scratch then fit everything in view
  const reLayout = useCallback(() => {
    if (!diagram) return
    try {
      const { nodes: n, edges: e } = buildReactFlowGraph(parseMermaidErDiagram(diagram))
      setNodes(n)
      setEdges(e)
      setTimeout(() => rfRef.current?.fitView({ padding: 0.2, duration: 400 }), 50)
    } catch { /* ignore parse errors */ }
  }, [diagram, setNodes, setEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      // onInit gives us the direct flow instance — used for fitView.
      // Delay 300ms so the SplitPane CSS width transition (250ms) and the
      // framer-motion entrance animation (220ms) have both completed before
      // we try to fit the view — otherwise the container can still be 0px wide.
      onInit={(instance) => {
        rfRef.current = instance
        setTimeout(() => instance.fitView({ padding: 0.2 }), 300)
      }}
      minZoom={0.2}
      maxZoom={2}
      style={{ height: '100%' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="#252538"
      />
      <Controls
        className="!bg-panel !border-brd [&_button]:!bg-surf [&_button]:!border-brd [&_button]:!text-sec [&_button:hover]:!text-hi"
      />
      <MiniMap
        nodeColor="#252538"
        maskColor="rgba(8,8,15,0.7)"
        className="!bg-panel/80 !border-brd"
      />
      <RefreshButton onClick={reLayout} />
    </ReactFlow>
  )
}

// ── Outer panel — owns parsing + AnimatePresence ──────────────────
export function DiagramPanel() {
  const { diagram } = useAppStore()

  // Parse + layout whenever diagram string changes
  const { nodes: parsedNodes, edges: parsedEdges } = useMemo(() => {
    if (!diagram) return { nodes: [] as ERNodeType[], edges: [] as EREdgeType[] }
    try {
      return buildReactFlowGraph(parseMermaidErDiagram(diagram))
    } catch {
      return { nodes: [] as ERNodeType[], edges: [] as EREdgeType[] }
    }
  }, [diagram])

  return (
    <div className="relative flex flex-col h-full bg-panel rf-bg">
      <AnimatePresence mode="wait">
        {!diagram ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full"
          >
            <EmptyDiagram />
          </motion.div>
        ) : (
          <motion.div
            key="flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 h-full"
          >
            {/*
              FlowCanvas mounts fresh each time the panel shows (key="flow" remounts
              when diagram goes null→non-null). onInit re-fires, fitView re-runs.
              No ReactFlowProvider needed — ReactFlow creates its own provider internally,
              and rfRef captures that exact instance via onInit.
            */}
            <FlowCanvas parsedNodes={parsedNodes} parsedEdges={parsedEdges} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
