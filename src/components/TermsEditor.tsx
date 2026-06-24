import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Term } from '../api/types'
import { VirtualizedTerms, parseAliases } from './VirtualizedTerms'

// Full term editor shared by the detail-page curate flow and the blank manual
// create flow: add a term (canonical + aliases), edit any term's canonical or
// aliases, and remove a term. Operates on a controlled `terms` array via
// `onChange`; the strict invariants are enforced server-side on PUT.
export function TermsEditor({
  terms,
  onChange,
}: {
  terms: Term[]
  onChange: (terms: Term[]) => void
}) {
  const { t } = useTranslation()
  const [newCanonical, setNewCanonical] = useState('')
  const [newAliases, setNewAliases] = useState('')

  function addTerm() {
    const canonical = newCanonical.trim()
    if (!canonical) return
    const term: Term = { canonical, aliases: parseAliases(newAliases), meta: {} }
    onChange([term, ...terms])
    setNewCanonical('')
    setNewAliases('')
  }

  function changeCanonical(index: number, canonical: string) {
    onChange(terms.map((tm, i) => (i === index ? { ...tm, canonical } : tm)))
  }

  function changeAliases(index: number, aliases: string[]) {
    onChange(terms.map((tm, i) => (i === index ? { ...tm, aliases } : tm)))
  }

  function removeTerm(index: number) {
    onChange(terms.filter((_, i) => i !== index))
  }

  return (
    <div className="terms-editor">
      <div className="term-add">
        <input
          className="input input-sm term-canonical-input"
          value={newCanonical}
          placeholder={t('vocab.canonicalPlaceholder')}
          onChange={(e) => setNewCanonical(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTerm()
            }
          }}
        />
        <input
          className="input input-sm term-alias-input"
          value={newAliases}
          placeholder={t('vocab.aliasesPlaceholder')}
          onChange={(e) => setNewAliases(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTerm()
            }
          }}
        />
        <button
          type="button"
          className="btn btn-sm"
          onClick={addTerm}
          disabled={!newCanonical.trim()}
        >
          {t('vocab.addTerm')}
        </button>
      </div>

      <VirtualizedTerms
        terms={terms}
        editing
        onAliasesChange={changeAliases}
        onCanonicalChange={changeCanonical}
        onRemoveTerm={removeTerm}
      />
    </div>
  )
}
