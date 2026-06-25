import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDeriveVocabulary, useRefs } from '../api/hooks'
import { FEATURES, useModuleEnabled } from '../api/capabilities'
import type { Extractor } from '../api/types'
import { Card, ErrorState, FeatureDisabled, InlineError, Spinner } from '../components/ui'

export function VocabularyDerivePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const enabled = useModuleEnabled(FEATURES.vocabularies)
  const refs = useRefs()
  const derive = useDeriveVocabulary()

  const [name, setName] = useState('')
  const [dataset, setDataset] = useState('')
  const [dimension, setDimension] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [rawKey, setRawKey] = useState('')
  const [stdKey, setStdKey] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  if (!enabled) {
    return (
      <Card title={t('vocab.deriveTitle')}>
        <FeatureDisabled>{t('vocab.disabled')}</FeatureDisabled>
      </Card>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const n = name.trim()
    const ds = dataset.trim()
    const dim = dimension.trim()
    if (!n || !ds || !dim) {
      setFormError(t('vocab.errRequired'))
      return
    }

    // The extractor is optional; only send it when both keys are filled. If left
    // blank the server falls back to a preset for known dimensions.
    let extractor: Extractor | undefined
    if (advanced && (rawKey.trim() || stdKey.trim())) {
      if (!rawKey.trim() || !stdKey.trim()) {
        setFormError(t('vocab.errExtractorKeys'))
        return
      }
      extractor = { source: 'assistant_json', raw_key: rawKey.trim(), std_key: stdKey.trim() }
    }

    derive.mutate(
      { name: n, dataset: ds, dimension: dim, extractor },
      {
        onSuccess: (vocab) => {
          navigate(`/vocabularies/${encodeURIComponent(vocab.name ?? n)}`)
        },
      },
    )
  }

  const refItems = refs.data?.items ?? []

  return (
    <Card title={t('vocab.deriveTitle')}>
      <div className="breadcrumb">
        <Link to="/vocabularies">{t('vocab.backToList')}</Link>
      </div>
      <p className="text-muted">{t('vocab.deriveDescription')}</p>

      <form className="form" onSubmit={submit}>
        <label className="field-label">{t('vocab.nameLabel')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="field-label">{t('vocab.datasetLabel')}</label>
        {refs.isLoading && <Spinner />}
        {refs.isError && <ErrorState error={refs.error} />}
        {refs.data && (
          <select
            className="input"
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
          >
            <option value="">{t('vocab.datasetPlaceholder')}</option>
            {refItems.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        )}

        <label className="field-label">{t('vocab.dimensionLabel')}</label>
        <input
          className="input"
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
          placeholder={t('vocab.dimensionPlaceholder')}
        />

        <details className="details" open={advanced}>
          <summary onClick={(e) => { e.preventDefault(); setAdvanced((v) => !v) }}>
            {t('vocab.extractorAdvanced')}
          </summary>
          {advanced && (
            <div className="stack">
              <p className="text-muted">{t('vocab.extractorHint')}</p>
              <label className="field-label">{t('vocab.extractorSource')}</label>
              <input className="input" value="assistant_json" disabled />
              <label className="field-label">{t('vocab.rawKeyLabel')}</label>
              <input className="input" value={rawKey} onChange={(e) => setRawKey(e.target.value)} />
              <label className="field-label">{t('vocab.stdKeyLabel')}</label>
              <input className="input" value={stdKey} onChange={(e) => setStdKey(e.target.value)} />
            </div>
          )}
        </details>

        <button className="btn btn-primary" type="submit" disabled={derive.isPending}>
          {derive.isPending ? t('vocab.deriving') : t('vocab.deriveAction')}
        </button>
      </form>

      {formError && <div className="text-error">{formError}</div>}
      {derive.isError && <InlineError error={derive.error} />}
    </Card>
  )
}
