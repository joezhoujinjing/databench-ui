import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataset } from '../api/hooks'
import { downloadExport, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../api/client'
import { FEATURES, useModuleEnabled } from '../api/capabilities'
import { ApiError } from '../api/http'
import { Card, ErrorState, InlineError, Spinner } from '../components/ui'
import { ManifestView } from '../components/ManifestView'
import { VirtualizedSamples } from '../components/VirtualizedSamples'

const PAGE_SIZES = [20, 50, 100, 200, MAX_PAGE_LIMIT]

export function DatasetDetailPage() {
  const { t } = useTranslation()
  const { ref = '' } = useParams()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_LIMIT)

  const dataset = useDataset(ref)
  const lineageEnabled = useModuleEnabled(FEATURES.lineage)
  const exportEnabled = useModuleEnabled(FEATURES.export)

  return (
    <div className="stack">
      <div className="breadcrumb">
        <Link to="/datasets">{t('detail.backToDatasets')}</Link>
        <span className="text-muted"> / </span>
        <code>{ref}</code>
        {lineageEnabled && (
          <Link className="btn btn-sm" to={`/lineage?ref=${encodeURIComponent(ref)}`}>
            {t('detail.viewLineage')}
          </Link>
        )}
      </div>

      <Card title={t('detail.manifest')}>
        {dataset.isLoading && <Spinner />}
        {dataset.isError && <ErrorState error={dataset.error} />}
        {dataset.data && (
          <>
            <ManifestView manifest={dataset.data} />
            {exportEnabled && <ExportButton refName={ref} />}
          </>
        )}
      </Card>

      <Card title={t('detail.samples')}>
        <div className="row between samples-controls">
          <span className="text-muted">{t('detail.pageSizeHint', { max: MAX_PAGE_LIMIT })}</span>
          <label className="row gap-sm">
            <span className="text-muted">{t('detail.pageSize')}</span>
            <select
              className="input input-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        {ref && <VirtualizedSamples key={`${ref}:${pageSize}`} refName={ref} pageSize={pageSize} />}
      </Card>
    </div>
  )
}

function ExportButton({ refName }: { refName: string }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function onClick() {
    setBusy(true)
    setError(null)
    try {
      await downloadExport(refName)
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error(String(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="row gap mt">
      <button className="btn btn-primary" onClick={onClick} disabled={busy}>
        {busy ? t('detail.exporting') : t('detail.exportJsonl')}
      </button>
      <span className="text-muted">{t('detail.exportHint')}</span>
      {error != null && <InlineError error={error} />}
    </div>
  )
}
