import { useState } from 'react'

// Recursive, collapsible renderer for arbitrarily-nested provenance DAGs.
// Objects/arrays become expandable nodes; primitives render inline.

function isContainer(v: unknown): v is Record<string, unknown> | unknown[] {
  return v !== null && typeof v === 'object'
}

function primitiveText(v: unknown): string {
  if (v === null) return 'null'
  if (typeof v === 'string') return v
  return String(v)
}

function preview(value: unknown): string {
  if (Array.isArray(value)) return `[${value.length}]`
  if (isContainer(value)) {
    const keys = Object.keys(value)
    const head = keys.slice(0, 3).join(', ')
    return `{${head}${keys.length > 3 ? ', …' : ''}}`
  }
  return ''
}

export function TreeNode({
  label,
  value,
  defaultOpen = false,
}: {
  label: string
  value: unknown
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!isContainer(value)) {
    return (
      <div className="tree-leaf">
        <span className="tree-key">{label}:</span>{' '}
        <span className={`tree-val tree-${typeof value}`}>{primitiveText(value)}</span>
      </div>
    )
  }

  const entries: [string, unknown][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value)

  return (
    <div className="tree-node">
      <button className="tree-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="tree-caret">{open ? '▾' : '▸'}</span>
        <span className="tree-key">{label}</span>
        {!open && <span className="tree-preview">{preview(value)}</span>}
      </button>
      {open && (
        <div className="tree-children">
          {entries.length === 0 ? (
            <div className="tree-leaf text-muted">{Array.isArray(value) ? '[]' : '{}'}</div>
          ) : (
            entries.map(([k, v]) => <TreeNode key={k} label={k} value={v} defaultOpen={false} />)
          )}
        </div>
      )}
    </div>
  )
}
