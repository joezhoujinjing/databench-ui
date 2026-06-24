import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useVocabulary,
  usePutVocabulary,
  useRefs,
  useNormalizeVocabulary,
  useValidateVocabulary,
} from '../api/hooks'
import type {
  AliasConflict,
  Term,
  ValidateResponse,
  Vocabulary,
  VocabularyInput,
} from '../api/types'
import { Card, ErrorState, InlineError, JsonBlock, Spinner } from '../components/ui'
import { ManifestView } from '../components/ManifestView'
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
      name: vocab.name ?? routeName,
      dimension: vocab.dimension,
      status: targetStatus,
      terms: draftTerms,
      meta: vocab.meta ?? {},
      source: vocab.source ?? null,
    }
    put.mutate(
      { name: vocab.name ?? routeName, payload },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <>
      <Card title={vocab.name ?? routeName}>
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

      <ApplyToDataset vocabName={routeName} dimension={vocab.dimension} />

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

// Apply a curated vocabulary to a dataset. Validate checks the dataset's
// standard labels against the vocab (and persists a signal-annotated copy);
// normalize rewrites each std label to its canonical and persists a new
// content-addressed dataset. The extractor body is never sent — the server
// resolves it from the vocab's meta.extractor or a dimension preset.
function ApplyToDataset({ vocabName, dimension }: { vocabName: string; dimension: string }) {
  const { t } = useTranslation()
  const refs = useRefs()
  const normalize = useNormalizeVocabulary()
  const validate = useValidateVocabulary()
  const [dataset, setDataset] = useState('')
  const [outRef, setOutRef] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const refItems = refs.data?.items ?? []
  const pending = normalize.isPending || validate.isPending

  function run(kind: 'validate' | 'normalize') {
    setFormError(null)
    const ds = dataset.trim()
    if (!ds) {
      setFormError(t('vocab.applyErrDataset'))
      return
    }
    const ref = outRef.trim() || undefined
    if (kind === 'validate') {
      normalize.reset()
      validate.mutate({ name: vocabName, dataset: ds, ref })
    } else {
      validate.reset()
      normalize.mutate({ name: vocabName, dataset: ds, ref })
    }
  }

  return (
    <Card title={t('vocab.applyTitle')}>
      <p className="text-muted">{t('vocab.applyDescription')}</p>

      <div className="form">
        <label className="field-label">{t('vocab.applyDatasetLabel')}</label>
        <input
          className="input"
          list="vocab-apply-refs"
          value={dataset}
          placeholder={t('vocab.applyDatasetPlaceholder')}
          onChange={(e) => setDataset(e.target.value)}
        />
        <datalist id="vocab-apply-refs">
          {refItems.map((r) => (
            <option key={r.name} value={r.name} />
          ))}
        </datalist>

        <label className="field-label">{t('vocab.applyOutputLabel')}</label>
        <input
          className="input"
          value={outRef}
          placeholder={t('vocab.applyOutputPlaceholder')}
          onChange={(e) => setOutRef(e.target.value)}
        />

        <div className="row gap-sm">
          <button className="btn" onClick={() => run('validate')} disabled={pending}>
            {validate.isPending ? t('vocab.applyRunning') : t('vocab.validateAction')}
          </button>
          <button className="btn btn-primary" onClick={() => run('normalize')} disabled={pending}>
            {normalize.isPending ? t('vocab.applyRunning') : t('vocab.normalizeAction')}
          </button>
        </div>
      </div>

      {formError && <div className="text-error">{formError}</div>}
      {validate.isError && <InlineError error={validate.error} />}
      {normalize.isError && <InlineError error={normalize.error} />}

      {validate.data && <ValidateResult dimension={dimension} result={validate.data} />}
      {normalize.data && (
        <div className="result-block">
          <div className="result-head">✓ {t('vocab.normalizeDone')}</div>
          <ManifestView manifest={normalize.data} linkToDetail />
        </div>
      )}
    </Card>
  )
}

function ValidateResult({ dimension, result }: { dimension: string; result: ValidateResponse }) {
  const { t } = useTranslation()
  const offending = Object.entries(result.summary.offending_values ?? {})
  return (
    <div className="result-block">
      <div className="result-head">✓ {t('vocab.validateDone')}</div>
      <div className="badges vocab-meta">
        <span className="badge">{t('vocab.validateChecked', { count: result.summary.checked })}</span>
        <span className={result.summary.invalid > 0 ? 'badge status-review' : 'badge'}>
          {t('vocab.validateInvalid', { count: result.summary.invalid })}
        </span>
        <span className="badge">
          {t('vocab.validateSignal')}: <code>vocab_{dimension}_valid</code>
        </span>
      </div>
      {offending.length > 0 && (
        <div className="offending">
          <span className="text-muted">{t('vocab.offendingValues')}: </span>
          {offending.map(([value, count]) => (
            <span key={value} className="chip">
              {value}
              <span className="text-muted"> ·{count}</span>
            </span>
          ))}
        </div>
      )}
      <ManifestView manifest={result.dataset} linkToDetail />
    </div>
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
