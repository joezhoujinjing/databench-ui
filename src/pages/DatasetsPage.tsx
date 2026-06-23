import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRefs } from '../api/hooks'
import { Card, EmptyState, ErrorState, Spinner } from '../components/ui'

export function DatasetsPage() {
  const { t } = useTranslation()
  const refs = useRefs()
  const [filter, setFilter] = useState('')

  const rows = useMemo(() => {
    const entries = Object.entries(refs.data ?? {})
    const f = filter.trim().toLowerCase()
    const filtered = f
      ? entries.filter(([name, version]) =>
          name.toLowerCase().includes(f) || version.toLowerCase().includes(f),
        )
      : entries
    return filtered.sort((a, b) => a[0].localeCompare(b[0]))
  }, [refs.data, filter])

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
              {Object.keys(refs.data).length === 0
                ? t('datasets.emptyNoRefs')
                : t('datasets.emptyNoMatch')}
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
                {rows.map(([name, version]) => (
                  <tr key={name}>
                    <td>
                      <Link to={`/datasets/${encodeURIComponent(version)}`}>{name}</Link>
                    </td>
                    <td>
                      <Link to={`/datasets/${encodeURIComponent(version)}`}>
                        <code>{version}</code>
                      </Link>
                    </td>
                    <td className="text-right">
                      <Link className="btn btn-sm" to={`/lineage?ref=${encodeURIComponent(version)}`}>
                        {t('datasets.lineage')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Card>
  )
}
