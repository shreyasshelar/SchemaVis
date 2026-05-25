import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'
import type { EREdgeData } from '@/types/diagram'

export type EREdgeType = Edge<EREdgeData>

// Maps Mermaid cardinality tokens → display glyphs
const CARD_GLYPH: Record<string, string> = {
  '||':   '1',
  '|o':   '0..1',
  'o|':   '0..1',
  '}o':   '0..*',
  'o{':   '0..*',
  '}|':   '1..*',
  '|{':   '1..*',
}

function cardLabel(raw: string) {
  return CARD_GLYPH[raw] ?? raw
}

export const EREdge = memo(function EREdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  data,
}: EdgeProps<EREdgeType>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX, sourceY, targetX, targetY,
  })

  const fromCard = data?.fromCardinality as string | undefined
  const toCard   = data?.toCardinality as string | undefined
  const label    = data?.label as string | undefined

  const midSrcX = sourceX + (targetX - sourceX) * 0.12
  const midSrcY = sourceY + (targetY - sourceY) * 0.12 - 10
  const midTgtX = targetX - (targetX - sourceX) * 0.12
  const midTgtY = targetY - (targetY - sourceY) * 0.12 - 10

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: '#303048', strokeWidth: 1.5 }}
      />

      <EdgeLabelRenderer>
        {/* Cardinality near source */}
        {fromCard && (
          <div
            className="absolute text-2xs font-mono text-muted pointer-events-none"
            style={{ transform: `translate(-50%, -50%) translate(${midSrcX}px, ${midSrcY}px)` }}
          >
            {cardLabel(fromCard)}
          </div>
        )}

        {/* Relationship label (middle) */}
        {label && (
          <div
            className="absolute px-1.5 py-0.5 rounded-md bg-panel border border-brd text-2xs text-sec pointer-events-none"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label}
          </div>
        )}

        {/* Cardinality near target */}
        {toCard && (
          <div
            className="absolute text-2xs font-mono text-muted pointer-events-none"
            style={{ transform: `translate(-50%, -50%) translate(${midTgtX}px, ${midTgtY}px)` }}
          >
            {cardLabel(toCard)}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
})
