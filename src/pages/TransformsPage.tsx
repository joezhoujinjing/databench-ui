import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRunTransform, useTransforms } from '../api/hooks'
import type { TransformInfo } from '../api/types'
import { Card, ErrorState, InlineError, JsonBlock, Spinner } from '../components/ui'
import { ManifestView } from '../components/ManifestView'

export function TransformsPage() {
  const { t } = useTranslation()
  const transforms = useTransforms()
  const [selected, setSelected] = useState<TransformInfo | null>(null)

  return (
    <div className="grid-2">
      <Card title={t('transforms.title')}>
        {transforms.isLoading && <Spinner />}
        {transforms.isError && <ErrorState error={transforms.error} />}
        {transforms.data && transforms.data.items.length === 0 && (
          <div className="text-muted">{t('transforms.emptyList')}</div>
        )}
        {transforms.data && (
          <ul className="list">
            {transforms.data.items.map((tr) => (
              <li key={`${tr.name}@${tr.version}`}>
                <button
                  className={`list-item ${selected?.name === tr.name ? 'active' : ''}`}
                  onClick={() => setSelected(tr)}
                >
                  <span className="list-item-title">{tr.name}</span>
                  <code className="text-muted">v{tr.version}</code>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected ? (
        <RunTransformCard key={selected.name} transform={selected} />
      ) : (
        <Card title={t('transforms.runHeading')}>
          <div className="text-muted">{t('transforms.selectPrompt')}</div>
        </Card>
      )}
    </div>
  )
}

function RunTransformCard({ transform }: { transform: TransformInfo }) {
  const { t } = useTranslation()
  const run = useRunTransform()
  const [inputsText, setInputsText] = useState('')
  const [paramsText, setParamsText] = useState('{}')
  const [outRef, setOutRef] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const inputs = inputsText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (inputs.length === 0) {
      setFormError(t('transforms.errNeedInput'))
      return
    }

    let params: Record<string, unknown> = {}
    if (paramsText.trim()) {
      try {
        const parsed = JSON.parse(paramsText)
        if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setFormError(t('transforms.errParamsObject'))
          return
        }
        params = parsed as Record<string, unknown>
      } catch (err) {
        setFormError(t('transforms.errInvalidParams', { message: (err as Error).message }))
        return
      }
    }

    run.mutate({
      name: transform.name,
      payload: { inputs, params, ref: outRef || undefined },
    })
  }

  return (
    <Card title={<>{t('transforms.runVerb')} <code>{transform.name}</code></>}>
      {transform.params_schema && (
        <details className="details">
          <summary>{t('transforms.paramsSchema')}</summary>
          <JsonBlock value={transform.params_schema} />
        </details>
      )}

      <form className="form" onSubmit={submit}>
        <label className="field-label">{t('transforms.inputsLabel')}</label>
        <textarea
          className="input textarea mono"
          rows={3}
          value={inputsText}
          onChange={(e) => setInputsText(e.target.value)}
          placeholder="my-dataset&#10;sha256:abc123…"
        />

        <label className="field-label">{t('transforms.paramsLabel')}</label>
        <textarea
          className="input textarea mono"
          rows={6}
          value={paramsText}
          onChange={(e) => setParamsText(e.target.value)}
        />

        <label className="field-label">{t('transforms.outputRefLabel')}</label>
        <input className="input" value={outRef} onChange={(e) => setOutRef(e.target.value)} />

        <button className="btn btn-primary" type="submit" disabled={run.isPending}>
          {run.isPending ? t('transforms.running') : t('transforms.runAction')}
        </button>
      </form>

      {formError && <div className="text-error">{formError}</div>}
      {run.isError && <InlineError error={run.error} />}
      {run.data && (
        <div className="result">
          <div className="result-head">✓ {t('transforms.outputManifest')}</div>
          <ManifestView manifest={run.data} linkToDetail />
        </div>
      )}
    </Card>
  )
}
