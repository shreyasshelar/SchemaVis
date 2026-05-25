// ── Parsed diagram model (internal) ─────────────────────────────
export interface ColumnDef {
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  isNullable: boolean
}

export interface TableDef {
  name: string
  columns: ColumnDef[]
}

export interface RelationshipDef {
  fromTable: string
  toTable: string
  fromCardinality: string   // e.g. "||", "|o", "}o"
  toCardinality: string
  label?: string
}

export interface ParsedDiagram {
  tables: TableDef[]
  relationships: RelationshipDef[]
}

// ── React Flow node/edge data ────────────────────────────────────
// Must extend Record<string, unknown> for @xyflow/react v12 generics
export interface ERNodeData extends Record<string, unknown> {
  label: string          // table name
  columns: ColumnDef[]
}

export interface EREdgeData extends Record<string, unknown> {
  fromCardinality: string
  toCardinality: string
  label?: string
}
