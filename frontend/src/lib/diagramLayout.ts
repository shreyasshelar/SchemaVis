import dagre from '@dagrejs/dagre'
import type { ParsedDiagram, ERNodeData, EREdgeData } from '@/types/diagram'
import type { ERNodeType } from '@/components/diagram/ERNode'
import type { EREdgeType } from '@/components/diagram/EREdge'

const NODE_W = 220
const NODE_H_BASE = 60   // header height
const ROW_H = 24          // per column row

export function buildReactFlowGraph(
  diagram: ParsedDiagram,
): { nodes: ERNodeType[]; edges: EREdgeType[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80, marginx: 24, marginy: 24 })
  g.setDefaultEdgeLabel(() => ({}))

  // ── Nodes ──────────────────────────────────────────────────────
  const nodes: ERNodeType[] = diagram.tables.map((t) => {
    const h = NODE_H_BASE + t.columns.length * ROW_H
    g.setNode(t.name, { width: NODE_W, height: h })
    const data: ERNodeData = { label: t.name, columns: t.columns }
    return {
      id:       t.name,
      type:     'erNode' as const,
      position: { x: 0, y: 0 },
      data,
    }
  })

  // ── Edges ──────────────────────────────────────────────────────
  const edges: EREdgeType[] = diagram.relationships.map((r, i) => {
    g.setEdge(r.fromTable, r.toTable)
    const data: EREdgeData = {
      fromCardinality: r.fromCardinality,
      toCardinality:   r.toCardinality,
      label:           r.label,
    }
    return {
      id:     `e-${i}-${r.fromTable}-${r.toTable}`,
      source: r.fromTable,
      target: r.toTable,
      type:   'erEdge' as const,
      data,
    }
  })

  // Run layout
  dagre.layout(g)

  // Apply positions
  nodes.forEach((n) => {
    const pos = g.node(n.id)
    const h = NODE_H_BASE + (n.data.columns as ERNodeData['columns']).length * ROW_H
    n.position = { x: pos.x - NODE_W / 2, y: pos.y - h / 2 }
  })

  return { nodes, edges }
}
