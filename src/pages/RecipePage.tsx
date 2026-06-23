import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMaterializeRecipe } from '../api/hooks'
import type { Recipe } from '../api/types'
import { Card, InlineError } from '../components/ui'
import { ManifestView } from '../components/ManifestView'

const PLACEHOLDER = `{
  "name": "my-mix",
  "sources": [
    { "dataset": "material-sft", "weight": 1.0 }
  ],
  "target_format": "messages-jsonl",
  "seed": 0
}`

export function RecipePage() {
  const { t } = useTranslation()
  const materialize = useMaterializeRecipe()
  const [text, setText] = useState('')
  const [outRef, setOutRef] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setParseError(null)
    let recipe: Recipe
    try {
      const parsed = JSON.parse(text)
      if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setParseError(t('recipe.errRecipeObject'))
        return
      }
      recipe = parsed as Recipe
    } catch (err) {
      setParseError(t('recipe.errInvalidJson', { message: (err as Error).message }))
      return
    }
    materialize.mutate({ recipe, ref: outRef || undefined })
  }

  return (
    <Card title={t('recipe.title')}>
      <p className="text-muted">{t('recipe.description')}</p>
      <form className="form" onSubmit={submit}>
        <label className="field-label">{t('recipe.recipeLabel')}</label>
        <textarea
          className="input textarea mono"
          rows={14}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <label className="field-label">{t('recipe.outputRefLabel')}</label>
        <input className="input" value={outRef} onChange={(e) => setOutRef(e.target.value)} />

        <button className="btn btn-primary" type="submit" disabled={!text.trim() || materialize.isPending}>
          {materialize.isPending ? t('recipe.materializing') : t('recipe.materializeAction')}
        </button>
      </form>

      {parseError && <div className="text-error">{parseError}</div>}
      {materialize.isError && <InlineError error={materialize.error} />}
      {materialize.data && (
        <div className="result">
          <div className="result-head">✓ {t('recipe.materialized')}</div>
          <ManifestView manifest={materialize.data} linkToDetail />
        </div>
      )}
    </Card>
  )
}
