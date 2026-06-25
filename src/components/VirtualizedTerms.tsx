import { useEffect, useRef, useState } from 'react'
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
                  <AliasInput
                    value={(term.aliases ?? []).join(', ')}
                    placeholder={t('vocab.aliasesPlaceholder')}
                    onCommit={(aliases) => onAliasesChange?.(vi.index, aliases)}
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

// Controlled alias editor that holds the user's RAW text while focused and only
// parses (split/trim/filter) into the alias array on blur. Parsing on every
// keystroke would round-trip text -> array -> join(', '), which eats the
// separator the instant a "," is typed, making it impossible to add an alias.
// When unfocused, it re-syncs from the parent's normalized value so virtualized
// row recycling shows the right term.
function AliasInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string
  placeholder: string
  onCommit: (aliases: string[]) => void
}) {
  const [text, setText] = useState(value)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(value)
  }, [value, focused])

  return (
    <input
      className="input input-sm term-alias-input"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        onCommit(parseAliases(text))
      }}
    />
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
