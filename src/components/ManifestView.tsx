import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Manifest } from '../api/types'
import { JsonBlock } from './ui'

const KNOWN_KEYS = new Set(['version', 'name', 'num_rows', 'kinds'])

export function ManifestView({
  manifest,
  linkToDetail = false,
}: {
  manifest: Manifest
  linkToDetail?: boolean
}) {
  const { t } = useTranslation()
  const extra = Object.fromEntries(
    Object.entries(manifest).filter(([k]) => !KNOWN_KEYS.has(k)),
  )
  const hasExtra = Object.keys(extra).length > 0
  const kinds = Object.entries(manifest.kinds ?? {}).filter(([, n]) => n != null)

  return (
    <div className="manifest">
      <div className="kv-grid">
        <div className="kv">
          <span className="kv-key">{t('manifest.version')}</span>
          <span className="kv-val">
            {linkToDetail ? (
              <Link to={`/datasets/${encodeURIComponent(manifest.version)}`}>
                <code>{manifest.version}</code>
              </Link>
            ) : (
              <code>{manifest.version}</code>
            )}
          </span>
        </div>
        <div className="kv">
          <span className="kv-key">{t('manifest.name')}</span>
          <span className="kv-val">{manifest.name ?? <em className="text-muted">{t('common.dash')}</em>}</span>
        </div>
        <div className="kv">
          <span className="kv-key">{t('manifest.numRows')}</span>
          <span className="kv-val">{manifest.num_rows}</span>
        </div>
      </div>

      <div className="kinds">
        <span className="kv-key">{t('manifest.kinds')}</span>
        {kinds.length ? (
          <span className="badges">
            {kinds.map(([k, n]) => (
              <span key={k} className="badge">
                {k}: {n as number}
              </span>
            ))}
          </span>
        ) : (
          <em className="text-muted">{t('common.none')}</em>
        )}
      </div>

      {hasExtra && (
        <details className="details">
          <summary>{t('manifest.otherFields')}</summary>
          <JsonBlock value={extra} />
        </details>
      )}
    </div>
  )
}
