import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRefs } from '../api/hooks'
import { FEATURES, useModuleEnabled } from '../api/capabilities'
import { Card, EmptyState, ErrorState, Spinner } from '../components/ui'

export function DatasetsPage() {
  const { t } = useTranslation()
  const refs = useRefs()
  const lineageEnabled = useModuleEnabled(FEATURES.lineage)
  const [filter, setFilter] = useState('')

  const items = refs.data?.items ?? []

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const filtered = f
      ? items.filter(
          (r) => r.name.toLowerCase().includes(f) || r.version.toLowerCase().includes(f),
        )
      : items
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [items, filter])

  return (
    <Card title={t('datasets.title')}>
      <p className="text-muted">{t('datasets.description')}</p>

      {refs.isLoading && <Spinner />}
      {refs.isError && <ErrorState error={refs.error} />}

      {refs.data && (
        <>
          <input
            className="input"
            placeholder={t('datasets.filterPlaceholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {rows.length === 0 ? (
            <EmptyState>
              {items.length === 0 ? t('datasets.emptyNoRefs') : t('datasets.emptyNoMatch')}
            </EmptyState>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('datasets.colName')}</th>
                  <th>{t('datasets.colVersion')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <Link to={`/datasets/${encodeURIComponent(r.version)}`}>{r.name}</Link>
                    </td>
                    <td>
                      <Link to={`/datasets/${encodeURIComponent(r.version)}`}>
                        <code>{r.version}</code>
                      </Link>
                    </td>
                    <td className="text-right">
                      {lineageEnabled && (
                        <Link
                          className="btn btn-sm"
                          to={`/lineage?ref=${encodeURIComponent(r.version)}`}
                        >
                          {t('datasets.lineage')}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {refs.data.total > items.length && (
            <p className="text-muted">{t('datasets.cappedNote', { shown: items.length, total: refs.data.total })}</p>
          )}
        </>
      )}
    </Card>
  )
}
