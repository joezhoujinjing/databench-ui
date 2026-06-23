import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useHealth } from '../api/hooks'
import { DEFAULT_API_BASE, getApiBase, setApiBase } from '../api/client'

export function HealthBadge() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const health = useHealth()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(getApiBase())

  let status: 'connected' | 'disconnected' | 'checking' = 'checking'
  if (health.isError) status = 'disconnected'
  else if (health.data) status = 'connected'

  function apply() {
    setApiBase(draft)
    // Refetch everything against the new base.
    qc.invalidateQueries()
    setOpen(false)
  }

  function reset() {
    setApiBase('')
    setDraft(DEFAULT_API_BASE)
    qc.invalidateQueries()
  }

  return (
    <div className="health">
      <button className="health-badge" onClick={() => setOpen((v) => !v)} title={t('health.configure')}>
        <span className={`dot dot-${status}`} />
        <span className="health-label">{t(`health.${status}`)}</span>
      </button>

      {open && (
        <div className="health-popover">
          <label className="field-label">{t('health.apiBaseLabel')}</label>
          <input
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('health.apiBasePlaceholder')}
          />
          <div className="health-meta">
            {status === 'connected' && health.data ? (
              <>
                <div>{t('health.workspace')}: <code>{health.data.workspace_root}</code></div>
                <div>{t('health.status')}: <code>{health.data.status}</code></div>
              </>
            ) : status === 'disconnected' ? (
              <div className="text-error">{t('health.unreachable')}</div>
            ) : (
              <div className="text-muted">{t('health.checkingEllipsis')}</div>
            )}
          </div>
          <div className="row gap">
            <button className="btn btn-primary" onClick={apply}>{t('common.apply')}</button>
            <button className="btn" onClick={reset}>{t('health.reset')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
