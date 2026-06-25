import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBackend, DEFAULT_API_BASE } from '../api/backend'
import { useCapabilities } from '../api/capabilities'

// Top-bar connection status + configuration. Shows the live connection state and
// the backend's service/api versions, and lets the user point at a different
// origin and set a per-environment bearer token.
export function ConnectionPanel() {
  const { t } = useTranslation()
  const { base, token, setBase, setToken } = useBackend()
  const caps = useCapabilities()
  const [open, setOpen] = useState(false)
  const [baseDraft, setBaseDraft] = useState(base)
  const [tokenDraft, setTokenDraft] = useState(token)

  // Keep drafts in sync when the active backend changes (e.g. after reset).
  useEffect(() => setBaseDraft(base), [base])
  useEffect(() => setTokenDraft(token), [token])

  let status: 'connected' | 'disconnected' | 'checking' = 'checking'
  if (caps.isError) status = 'disconnected'
  else if (caps.capabilities) status = 'connected'

  function apply() {
    if (baseDraft !== base) setBase(baseDraft)
    setToken(tokenDraft)
    setOpen(false)
  }

  function reset() {
    setBase(DEFAULT_API_BASE)
    setBaseDraft(DEFAULT_API_BASE)
  }

  const ver = caps.version

  return (
    <div className="health">
      <button
        className="health-badge"
        onClick={() => setOpen((v) => !v)}
        title={t('connection.configure')}
      >
        <span className={`dot dot-${status}`} />
        <span className="health-label">{t(`health.${status}`)}</span>
        {ver && (
          <span className="health-ver">
            api {ver.api_version} · svc {ver.service_version}
          </span>
        )}
      </button>

      {open && (
        <div className="health-popover">
          <label className="field-label">{t('connection.apiBaseLabel')}</label>
          <input
            className="input"
            value={baseDraft}
            onChange={(e) => setBaseDraft(e.target.value)}
            placeholder={t('connection.apiBasePlaceholder')}
          />
          <div className="text-muted connection-hint">{t('connection.apiBaseHint')}</div>

          <label className="field-label">{t('connection.tokenLabel')}</label>
          <input
            className="input"
            type="password"
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
            placeholder={t('connection.tokenPlaceholder')}
            autoComplete="off"
          />
          <div className="text-muted connection-hint">{t('connection.tokenHint')}</div>

          <div className="health-meta">
            {status === 'connected' && ver ? (
              <>
                <div>{t('connection.apiVersion')}: <code>{ver.api_version}</code></div>
                <div>{t('connection.serviceVersion')}: <code>{ver.service_version}</code></div>
                <div>{t('connection.schemaVersion')}: <code>{ver.schema_version}</code></div>
                {caps.capabilities && (
                  <div className="feature-flags">
                    {Object.entries(caps.capabilities.features ?? {}).map(([name, on]) => (
                      <span key={name} className={`badge ${on ? 'feature-on' : 'feature-off'}`}>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : status === 'disconnected' ? (
              <div className="text-error">{t('connection.unreachable')}</div>
            ) : (
              <div className="text-muted">{t('health.checkingEllipsis')}</div>
            )}
          </div>

          <div className="row gap">
            <button className="btn btn-primary" onClick={apply}>{t('common.apply')}</button>
            <button className="btn" onClick={reset}>{t('connection.reset')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
