import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePutVocabulary } from '../api/hooks'
import { FEATURES, useModuleEnabled } from '../api/capabilities'
import type { Term, VocabularyInput } from '../api/types'
import { Card, FeatureDisabled, InlineError } from '../components/ui'
import { TermsEditor } from '../components/TermsEditor'

// Blank manual create: build a vocabulary from scratch (name + free-text
// dimension + hand-built terms) and submit it via PUT. No dataset/derive
// involved; the strict invariants are enforced server-side, surfaced inline.
export function VocabularyCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const enabled = useModuleEnabled(FEATURES.vocabularies)
  const put = usePutVocabulary()

  const [name, setName] = useState('')
  const [dimension, setDimension] = useState('')
  const [terms, setTerms] = useState<Term[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  if (!enabled) {
    return (
      <Card title={t('vocab.createTitle')}>
        <FeatureDisabled>{t('vocab.disabled')}</FeatureDisabled>
      </Card>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const n = name.trim()
    const dim = dimension.trim()
    if (!n || !dim) {
      setFormError(t('vocab.errNameDimension'))
      return
    }
    if (terms.length === 0) {
      setFormError(t('vocab.errNoTerms'))
      return
    }

    const payload: VocabularyInput = {
      name: n,
      dimension: dim,
      status: 'curated',
      terms,
      meta: {},
      source: null,
    }
    put.mutate(
      { name: n, payload },
      { onSuccess: () => navigate(`/vocabularies/${encodeURIComponent(n)}`) },
    )
  }

  return (
    <Card title={t('vocab.createTitle')}>
      <div className="breadcrumb">
        <Link to="/vocabularies">{t('vocab.backToList')}</Link>
      </div>
      <p className="text-muted">{t('vocab.createDescription')}</p>

      <form className="form" onSubmit={submit}>
        <label className="field-label">{t('vocab.nameLabel')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="field-label">{t('vocab.dimensionLabel')}</label>
        <input
          className="input"
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
          placeholder={t('vocab.dimensionPlaceholder')}
        />

        <label className="field-label">{t('vocab.termsTitle')}</label>
        <TermsEditor terms={terms} onChange={setTerms} />

        <button className="btn btn-primary" type="submit" disabled={put.isPending}>
          {put.isPending ? t('vocab.submitting') : t('vocab.createAction')}
        </button>
      </form>

      {formError && <div className="text-error">{formError}</div>}
      {put.isError && <InlineError error={put.error} />}
    </Card>
  )
}
