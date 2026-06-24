import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import type { Term } from '../api/types'
import { EmptyState } from './ui'

// Read-only or editable virtualized terms list. The full vocabulary is fetched
// in one request (or hand-built in the create flow), so we virtualize an
// in-memory array (brand has ~388 terms) and only render rows in view. In edit
// mode each row exposes editors for the canonical name and its comma-separated
// aliases, plus a remove control, all bound to the parent's draft state.
export function VirtualizedTerms({
  terms,
  editing = false,
  onAliasesChange,
  onCanonicalChange,
  onRemoveTerm,
}: {
  terms: Term[]
  editing?: boolean
  onAliasesChange?: (index: number, aliases: string[]) => void
  onCanonicalChange?: (index: number, canonical: string) => void
  onRemoveTerm?: (index: number) => void
}) {
  const { t } = useTranslation()
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: terms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (editing ? 92 : 64),
    overscan: 8,
  })

  if (terms.length === 0) return <EmptyState>{t('vocab.noTerms')}</EmptyState>

  return (
    <div ref={parentRef} className="virtual-scroll">
      <div className="virtual-inner" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const term = terms[vi.index]
          const count = readCount(term)
          return (
            <div
              key={vi.key}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="virtual-row"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              {editing ? (
                <div className="term-row term-row-edit">
                  <input
                    className="input input-sm term-canonical-input"
                    value={term.canonical}
                    placeholder={t('vocab.canonicalPlaceholder')}
                    onChange={(e) => onCanonicalChange?.(vi.index, e.target.value)}
                  />
                  <input
                    className="input input-sm term-alias-input"
                    value={(term.aliases ?? []).join(', ')}
                    placeholder={t('vocab.aliasesPlaceholder')}
                    onChange={(e) =>
                      onAliasesChange?.(vi.index, parseAliases(e.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-sm term-remove"
                    onClick={() => onRemoveTerm?.(vi.index)}
                    aria-label={t('vocab.removeTerm')}
                    title={t('vocab.removeTerm')}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="term-row">
                  <div className="term-canonical">
                    <strong>{term.canonical}</strong>
                    {count != null && <span className="text-muted"> · {count}</span>}
                  </div>
                  <div className="term-aliases">
                    {(term.aliases ?? []).length === 0 ? (
                      <span className="text-muted">{t('common.none')}</span>
                    ) : (
                      term.aliases!.map((a) => (
                        <span key={a} className="chip">{a}</span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function parseAliases(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function readCount(term: Term): number | undefined {
  const meta = term.meta as { count?: unknown } | undefined
  return typeof meta?.count === 'number' ? meta.count : undefined
}
