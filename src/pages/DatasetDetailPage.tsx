import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataset, useSamples } from '../api/hooks'
import { api } from '../api/client'
import { Card, EmptyState, ErrorState, Spinner } from '../components/ui'
import { ManifestView } from '../components/ManifestView'
import { SampleView } from '../components/SampleView'

const PAGE_SIZE = 20

export function DatasetDetailPage() {
  const { t } = useTranslation()
  const { ref = '' } = useParams()
  const [offset, setOffset] = useState(0)

  const dataset = useDataset(ref)
  const samples = useSamples(ref, PAGE_SIZE, offset)

  const total = samples.data?.total ?? 0
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

  return (
    <div className="stack">
      <div className="breadcrumb">
        <Link to="/datasets">{t('detail.backToDatasets')}</Link>
        <span className="text-muted"> / </span>
        <code>{ref}</code>
        <Link className="btn btn-sm" to={`/lineage?ref=${encodeURIComponent(ref)}`}>
          {t('detail.viewLineage')}
        </Link>
      </div>

      <Card title={t('detail.manifest')}>
        {dataset.isLoading && <Spinner />}
        {dataset.isError && <ErrorState error={dataset.error} />}
        {dataset.data && (
          <>
            <ManifestView manifest={dataset.data} />
            <div className="row gap mt">
              <a className="btn btn-primary" href={api.exportUrl(ref)} download>
                {t('detail.exportJsonl')}
              </a>
              <span className="text-muted">{t('detail.exportHint')}</span>
            </div>
          </>
        )}
      </Card>

      <Card title={t('detail.samples')}>
        {samples.isLoading && <Spinner />}
        {samples.isError && <ErrorState error={samples.error} />}

        {samples.data && (
          <>
            <div className="row between">
              <span className="text-muted">
                {total > 0
                  ? t('detail.showingRange', {
                      from: offset + 1,
                      to: Math.min(offset + PAGE_SIZE, total),
                      total,
                    })
                  : t('detail.noSamples')}
              </span>
              <div className="row gap">
                <button
                  className="btn btn-sm"
                  disabled={!canPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                >
                  {t('common.prev')}
                </button>
                <button
                  className="btn btn-sm"
                  disabled={!canNext}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>

            {samples.data.items.length === 0 ? (
              <EmptyState>{t('detail.emptyRange')}</EmptyState>
            ) : (
              <div className="sample-list">
                {samples.data.items.map((s, i) => (
                  <SampleView key={s.id != null ? String(s.id) : offset + i} sample={s} />
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
