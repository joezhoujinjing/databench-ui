import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVocabularies } from '../api/hooks'
import { FEATURES, useModuleEnabled } from '../api/capabilities'
import { Card, EmptyState, ErrorState, FeatureDisabled, Spinner } from '../components/ui'

export function VocabulariesPage() {
  const { t } = useTranslation()
  const enabled = useModuleEnabled(FEATURES.vocabularies)
  const vocabs = useVocabularies()
  const [filter, setFilter] = useState('')

  const items = vocabs.data?.items ?? []

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const filtered = f
      ? items.filter(
          (v) =>
            (v.name ?? '').toLowerCase().includes(f) ||
            v.dimension.toLowerCase().includes(f),
        )
      : items
    return [...filtered].sort((a, b) =>
      (a.name ?? a.id).localeCompare(b.name ?? b.id),
    )
  }, [items, filter])

  if (!enabled) {
    return (
      <Card title={t('vocab.title')}>
        <FeatureDisabled>{t('vocab.disabled')}</FeatureDisabled>
      </Card>
    )
  }

  return (
    <Card title={t('vocab.title')}>
      <div className="row between">
        <p className="text-muted">{t('vocab.description')}</p>
        <Link className="btn btn-primary btn-sm" to="/vocabularies/derive">
          {t('vocab.deriveAction')}
        </Link>
      </div>

      {vocabs.isLoading && <Spinner />}
      {vocabs.isError && <ErrorState error={vocabs.error} />}

      {vocabs.data && (
        <>
          <input
            className="input"
            placeholder={t('vocab.filterPlaceholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {rows.length === 0 ? (
            <EmptyState>
              {items.length === 0 ? t('vocab.emptyNone') : t('vocab.emptyNoMatch')}
            </EmptyState>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('vocab.colName')}</th>
                  <th>{t('vocab.colDimension')}</th>
                  <th>{t('vocab.colTerms')}</th>
                  <th>{t('vocab.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const key = v.name ?? v.id
                  // Older catalogs report null status for pre-existing rows; render
                  // "—" for those and the badge for vocabs that carry a status.
                  const status = v.status
                  return (
                    <tr key={v.id}>
                      <td>
                        <Link to={`/vocabularies/${encodeURIComponent(key)}`}>
                          {v.name ?? <code>{v.id}</code>}
                        </Link>
                      </td>
                      <td><code>{v.dimension}</code></td>
                      <td>{v.num_terms}</td>
                      <td>
                        {status ? (
                          <span className={`badge status-${status}`}>
                            {t(`vocab.status.${status}`)}
                          </span>
                        ) : (
                          <span className="text-muted">{t('common.dash')}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {vocabs.data.total > items.length && (
            <p className="text-muted">
              {t('vocab.cappedNote', { shown: items.length, total: vocabs.data.total })}
            </p>
          )}
        </>
      )}
    </Card>
  )
}
