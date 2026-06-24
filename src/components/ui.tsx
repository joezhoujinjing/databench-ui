import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { ApiError } from '../api/http'

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation()
  return <div className="state state-loading">{label ?? t('common.loading')}</div>
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state state-empty">{children}</div>
}

// Friendly state for a feature this deployment does not have wired up.
export function FeatureDisabled({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  return <div className="state state-disabled">{children ?? t('common.featureDisabled')}</div>
}

// For an ApiError we surface the unified envelope's code + message consistently.
// `message` is either the backend's localized detail or an i18n fallback.
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message
    return `${error.code} — ${error.message}`
  }
  if (error instanceof Error) return error.message
  return i18n.t('common.unknownError')
}

// Pull the specific, per-field validation messages out of an error envelope so a
// curator can see WHICH value is at fault (e.g. "alias '万马' maps to both '3M'
// and '万马股份'") instead of just the generic "request validation failed".
// Tolerant: the detail lives at body.error.detail (unified) or body.detail
// (legacy FastAPI) and may be an array of objects, a string, or absent.
function detailMessages(error: unknown): string[] {
  if (!(error instanceof ApiError) || error.status === 0) return []
  const body = error.detail
  if (!body || typeof body !== 'object') return []
  const env = (body as { error?: { detail?: unknown } }).error
  const detail = env?.detail ?? (body as { detail?: unknown }).detail
  if (typeof detail === 'string' && detail.trim()) return [stripValueError(detail)]
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d === 'object' ? String((d as { msg?: unknown }).msg ?? '') : String(d)))
      .map(stripValueError)
      .filter(Boolean)
  }
  return []
}

function stripValueError(msg: string): string {
  return msg.replace(/^Value error,\s*/, '').trim()
}

export function ErrorState({ error }: { error: unknown }) {
  const { t } = useTranslation()
  return (
    <div className="state state-error">
      <strong>{t('common.errorPrefix')}</strong> {messageFor(error)}
    </div>
  )
}

// Inline error suited for forms / mutation results. When the envelope carries
// per-field validation details, list each specific message (falling back to the
// top-level message when none are present).
export function InlineError({ error }: { error: unknown }) {
  const details = detailMessages(error)
  if (details.length === 0) return <div className="text-error">{messageFor(error)}</div>
  return (
    <div className="text-error">
      {details.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
    </div>
  )
}

export function Card({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      {title && <h2 className="card-title">{title}</h2>}
      {children}
    </section>
  )
}

export function JsonBlock({ value }: { value: unknown }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>
}
