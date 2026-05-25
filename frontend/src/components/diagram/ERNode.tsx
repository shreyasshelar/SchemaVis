import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { KeyIcon } from 'lucide-react'
import type { ERNodeData, ColumnDef } from '@/types/diagram'

export type ERNodeType = Node<ERNodeData, 'erNode'>

// ── Column row ────────────────────────────────────────────────────
function ColumnRow({ col }: { col: ColumnDef }) {
  return (
    <div className="flex items-center gap-1.5 px-3 h-6 border-t border-brd/50">
      {/* Key icon */}
      <span className="w-3 flex-none">
        {col.isPrimaryKey && <KeyIcon size={10} className="text-gold" />}
        {col.isForeignKey && !col.isPrimaryKey && <KeyIcon size={10} className="text-acc" />}
      </span>

      {/* Name */}
      <span
        className={[
          'flex-1 text-2xs font-mono truncate',
          col.isPrimaryKey ? 'text-gold' : col.isForeignKey ? 'text-acc' : 'text-hi',
        ].join(' ')}
      >
        {col.name}
      </span>

      {/* Type */}
      <span className="text-2xs text-muted font-mono truncate max-w-[80px]">
        {col.type}
      </span>

      {/* Nullable dot */}
      {col.isNullable && !col.isPrimaryKey && (
        <span className="w-1.5 h-1.5 rounded-full bg-muted/60 flex-none" title="nullable" />
      )}
    </div>
  )
}

// ── ER Node card ──────────────────────────────────────────────────
export const ERNode = memo(function ERNode({ data, selected }: NodeProps<ERNodeType>) {
  const columns = data.columns as ColumnDef[]

  return (
    <div
      className={[
        'rounded-lg overflow-hidden min-w-[200px]',
        'bg-panel border transition-shadow',
        selected
          ? 'border-acc shadow-glow'
          : 'border-brd hover:border-brdLt shadow-md',
      ].join(' ')}
    >
      {/* Table header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surf/80">
        <span className="w-2 h-2 rounded-full bg-acc/70 flex-none" />
        <span className="text-xs font-semibold text-hi font-mono truncate">
          {data.label as string}
        </span>
        <span className="ml-auto text-2xs text-muted font-mono">
          {columns.length} cols
        </span>
      </div>

      {/* Columns */}
      <div>
        {columns.map((col) => (
          <ColumnRow key={col.name} col={col} />
        ))}
      </div>

      {/* React Flow handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-brdLt !border-brd !rounded-full"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-brdLt !border-brd !rounded-full"
      />
    </div>
  )
})
