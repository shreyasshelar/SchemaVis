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
interface FlowCanvasProps {
  parsedNodes: ERNodeType[]
  parsedEdges: EREdgeType[]
}

function FlowCanvas({ parsedNodes, parsedEdges }: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rfRef        = useRef<ReactFlowInstance<ERNodeType, EREdgeType> | null>(null)
  const fitTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { diagram }  = useAppStore()

  const [nodes, setNodes, onNodesChange] = useNodesState<ERNodeType>(parsedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<EREdgeType>(parsedEdges)

  // ── Debounced fitView ──────────────────────────────────────────
  // Cancels any pending timer before scheduling a new one, so rapid calls
  // (diagram update + resize happening at the same ms) coalesce cleanly.
  const scheduleFit = useCallback((delay = 80) => {
    if (fitTimerRef.current) clearTimeout(fitTimerRef.current)
    fitTimerRef.current = setTimeout(() => {
      rfRef.current?.fitView({ padding: 0.2, duration: 300 })
    }, delay)
  }, [])

  // ── Cleanup on unmount (prevent stale timer callbacks) ─────────
  useEffect(() => () => {
    if (fitTimerRef.current) clearTimeout(fitTimerRef.current)
  }, [])

  // ── Sync nodes/edges when diagram changes (new AI response) ────
  useEffect(() => {
    setNodes(parsedNodes)
    setEdges(parsedEdges)
    scheduleFit(80)
  }, [parsedNodes, parsedEdges, setNodes, setEdges, scheduleFit])

  // ── ResizeObserver: re-fit when the container changes size ─────
  // Handles: initial mount while the SplitPane CSS width transition plays,
  // hide → show diagram toggle, and window resize.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let lastW = 0
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      // Only re-fit when the width actually grows to a non-zero value
      if (w > 0 && Math.abs(w - lastW) > 4) {
        lastW = w
        scheduleFit(150)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [scheduleFit])

  // ── Re-layout: recompute dagre positions from scratch ──────────
  const reLayout = useCallback(() => {
    if (!diagram) return
    try {
      const { nodes: n, edges: e } = buildReactFlowGraph(parseMermaidErDiagram(diagram))
      setNodes(n)
      setEdges(e)
      scheduleFit(80)
    } catch { /* ignore parse errors on malformed mermaid */ }
  }, [diagram, setNodes, setEdges, scheduleFit])

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge(connection, eds) as EREdgeType[]),
    [setEdges],
  )

  return (
    // containerRef lets ResizeObserver detect when this panel's width settles
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        // onInit: store the instance ref, then fit after transitions complete.
        // 300 ms covers the SplitPane CSS transition (250 ms) + framer-motion
        // entrance animation (220 ms) with a small margin.
        onInit={(instance) => {
          rfRef.current = instance
          scheduleFit(300)
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
    </div>
  )
}

// ── Outer panel — owns parsing + AnimatePresence ──────────────────
export function DiagramPanel() {
  const { diagram } = useAppStore()

  // Parse + layout whenever the diagram string changes.
  // Wrapped in try/catch so a malformed mermaid string never crashes the panel.
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
            transition={{ duration: 0.15 }}
            className="flex-1 h-full"
          >
            <EmptyDiagram />
          </motion.div>
        ) : (
          <motion.div
            key="flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 h-full"
          >
            {/*
              FlowCanvas key is intentionally absent here — it stays mounted as long
              as diagram is non-null.  Node/edge updates flow through props + useEffect.
              onInit fires once per mount.  ResizeObserver handles post-animation refits.
            */}
            <FlowCanvas parsedNodes={parsedNodes} parsedEdges={parsedEdges} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
