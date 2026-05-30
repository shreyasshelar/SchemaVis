import type { ParsedDiagram, TableDef, ColumnDef, RelationshipDef } from '@/types/diagram'

// ── Mermaid erDiagram parser ──────────────────────────────────────
// Input example:
//   erDiagram
//     USERS {
//       int id PK
//       varchar email UK "not null"
//     }
//     ORDERS ||--o{ ORDER_ITEMS : "contains"
//
// The parser is intentionally permissive — Gemini output varies slightly.

const ENTITY_RE  = /^\s*(\w+)\s*\{/
// Group 1: type — allows parens/brackets/commas for types like varchar(100), decimal(18,2)
// Group 2: name — plain identifier
// Group 3: key annotation (PK / FK / UK / empty)
// Group 4: optional quoted comment
const COLUMN_RE  = /^\s*([\w()[\],]+)\s+([\w]+)\s*(PK|FK|UK|)?\s*(?:"([^"]*)")?/i
const REL_RE     = /^\s*(\w+)\s+([|oO{}[\]]+--[|oO{}[\]]+)\s+(\w+)\s*(?::\s*"?([^"]+)"?)?/

// Cardinality token → human-readable abbreviation kept for edge labels
function parseCardinality(raw: string): [string, string] {
  // Split on "--" to get left and right sides
  const parts = raw.split('--')
  if (parts.length !== 2) return [raw, raw]
  return [parts[0].trim(), parts[1].trim()]
}

export function parseMermaidErDiagram(source: string): ParsedDiagram {
  const tables: TableDef[] = []
  const relationships: RelationshipDef[] = []

  // Strip the "erDiagram" header line and optional backtick fences
  const lines = source
    .replace(/```[\w]*/g, '')
    .split('\n')
    .map((l) => l.replace(/\r/, ''))

  let currentTable: TableDef | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip header / empty
    if (/^\s*erDiagram\s*$/i.test(line) || line.trim() === '') continue

    // End of entity block
    if (line.trim() === '}') {
      if (currentTable) {
        tables.push(currentTable)
        currentTable = null
      }
      continue
    }

    // Inside entity block — parse columns
    if (currentTable) {
      const col = line.match(COLUMN_RE)
      if (col) {
        const [, type, name, keyAnnotation] = col
        const colDef: ColumnDef = {
          name,
          type,
          isPrimaryKey: /PK/i.test(keyAnnotation ?? ''),
          isForeignKey: /FK/i.test(keyAnnotation ?? ''),
          isNullable:   !/not null/i.test(col[4] ?? ''),
        }
        currentTable.columns.push(colDef)
      }
      continue
    }

    // Entity open
    const ent = line.match(ENTITY_RE)
    if (ent) {
      currentTable = { name: ent[1], columns: [] }
      continue
    }

    // Relationship
    const rel = line.match(REL_RE)
    if (rel) {
      const [, fromTable, cardRaw, toTable, label] = rel
      const [from, to] = parseCardinality(cardRaw)
      relationships.push({ fromTable, toTable, fromCardinality: from, toCardinality: to, label })
    }
  }

  // Flush unclosed entity (malformed but be lenient)
  if (currentTable) tables.push(currentTable)

  return { tables, relationships }
}
