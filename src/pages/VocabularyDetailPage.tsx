import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVocabulary, usePutVocabulary } from '../api/hooks'
import type { AliasConflict, Term, Vocabulary, VocabularyInput } from '../api/types'
import { Card, ErrorState, InlineError, JsonBlock, Spinner } from '../components/ui'
import { VirtualizedTerms } from '../components/VirtualizedTerms'

export function VocabularyDetailPage() {
  const { t } = useTranslation()
  const { name = '' } = useParams()
  const vocab = useVocabulary(name)

  return (
    <div className="stack">
      <div className="breadcrumb">
        <Link to="/vocabularies">{t('vocab.backToList')}</Link>
        <span className="text-muted"> / </span>
        <code>{name}</code>
      </div>

      {vocab.isLoading && <Card title={name}><Spinner /></Card>}
      {vocab.isError && <Card title={name}><ErrorState error={vocab.error} /></Card>}
      {vocab.data && <VocabularyDetail vocab={vocab.data} routeName={name} />}
    </div>
  )
}

function VocabularyDetail({ vocab, routeName }: { vocab: Vocabulary; routeName: string }) {
  const { t } = useTranslation()
  const put = usePutVocabulary()
  const [editing, setEditing] = useState(false)
  const [draftTerms, setDraftTerms] = useState<Term[]>(vocab.terms ?? [])

  const terms = editing ? draftTerms : vocab.terms ?? []
  const status = vocab.status ?? 'curated'
  const extractor = readExtractor(vocab)

  const conflicts = useMemo(() => collectConflicts(vocab.terms ?? []), [vocab.terms])

  function startEdit() {
    setDraftTerms((vocab.terms ?? []).map((tm) => ({ ...tm, aliases: [...(tm.aliases ?? [])] })))
    setEditing(true)
    put.reset()
  }

  function cancelEdit() {
    setEditing(false)
    put.reset()
  }

  function changeAliases(index: number, aliases: string[]) {
    setDraftTerms((prev) => prev.map((tm, i) => (i === index ? { ...tm, aliases } : tm)))
  }

  function submit(targetStatus: 'draft' | 'curated') {
    const payload: VocabularyInput = {
      name: routeName,
      dimension: vocab.dimension,
      status: targetStatus,
      terms: draftTerms,
      meta: vocab.meta ?? {},
      source: vocab.source ?? null,
    }
    put.mutate(
      { name: routeName, payload },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <>
      <Card title={routeName}>
        <div className="badges vocab-meta">
          <span className={`badge status-${status}`}>{t(`vocab.status.${status}`)}</span>
          <span className="badge">{t('vocab.colDimension')}: <code>{vocab.dimension}</code></span>
          <span className="badge">{t('vocab.termCount', { count: (vocab.terms ?? []).length })}</span>
          {conflicts.length > 0 && (
            <span className="badge status-review">
              {t('vocab.needsReviewBadge', { count: conflicts.length })}
            </span>
          )}
        </div>
        <p className="text-muted vocab-id"><code>{vocab.id}</code></p>

        {extractor != null && (
          <details className="details">
            <summary>{t('vocab.provenance')}</summary>
            <JsonBlock value={extractor} />
          </details>
        )}
      </Card>

      {conflicts.length > 0 && (
        <Card title={t('vocab.needsReviewTitle')}>
          <p className="text-muted">{t('vocab.needsReviewHint')}</p>
          <div className="conflicts">
            {conflicts.map((c) => (
              <div key={c.canonical} className="conflict">
                <div className="conflict-head">
                  <strong>{c.canonical}</strong>
                </div>
                {c.aliases.map((ac) => (
                  <div key={ac.alias} className="conflict-row">
                    <code>{ac.alias}</code>
                    <span className="text-muted"> → </span>
                    <span className="chip chip-chosen">{ac.chosen ?? t('common.dash')}</span>
                    {ac.also_seen.length > 0 && (
                      <span className="conflict-also">
                        <span className="text-muted">{t('vocab.alsoSeen')}: </span>
                        {ac.also_seen.map((s) => (
                          <span key={s} className="chip">
                            {s}
                            {ac.counts[s] != null && (
                              <span className="text-muted"> ·{ac.counts[s]}</span>
                            )}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={t('vocab.termsTitle')}>
        <div className="row between vocab-terms-toolbar">
          <span className="text-muted">{t('vocab.termCount', { count: terms.length })}</span>
          {!editing ? (
            <button className="btn btn-sm" onClick={startEdit}>{t('vocab.curateAction')}</button>
          ) : (
            <div className="row gap-sm">
              <button className="btn btn-sm" onClick={cancelEdit} disabled={put.isPending}>
                {t('common.cancel')}
              </button>
              {status === 'draft' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => submit('curated')}
                  disabled={put.isPending}
                >
                  {put.isPending ? t('vocab.submitting') : t('vocab.promoteAction')}
                </button>
              )}
              <button
                className="btn btn-sm"
                onClick={() => submit(status)}
                disabled={put.isPending}
              >
                {put.isPending ? t('vocab.submitting') : t('vocab.saveAction')}
              </button>
            </div>
          )}
        </div>

        {editing && <p className="text-muted">{t('vocab.curateHint')}</p>}
        {put.isError && <InlineError error={put.error} />}
        {put.isSuccess && !editing && (
          <div className="result-head">✓ {t('vocab.saved')}</div>
        )}

        <VirtualizedTerms terms={terms} editing={editing} onAliasesChange={changeAliases} />
      </Card>
    </>
  )
}

function readExtractor(vocab: Vocabulary): unknown {
  const meta = vocab.meta as { extractor?: unknown } | undefined
  return meta?.extractor
}

interface CollectedConflict {
  canonical: string
  aliases: Array<{ alias: string; chosen?: string; also_seen: string[]; counts: Record<string, number> }>
}

// Pull terms whose meta.alias_conflicts is non-empty — the curator's review list.
function collectConflicts(terms: Term[]): CollectedConflict[] {
  const out: CollectedConflict[] = []
  for (const term of terms) {
    const meta = term.meta as { alias_conflicts?: Record<string, AliasConflict> } | undefined
    const ac = meta?.alias_conflicts
    if (!ac || typeof ac !== 'object') continue
    const aliases = Object.entries(ac).map(([alias, info]) => ({
      alias,
      chosen: info?.chosen,
      also_seen: Array.isArray(info?.also_seen) ? info.also_seen : [],
      counts: (info?.counts && typeof info.counts === 'object' ? info.counts : {}) as Record<string, number>,
    }))
    if (aliases.length > 0) out.push({ canonical: term.canonical, aliases })
  }
  return out
}
