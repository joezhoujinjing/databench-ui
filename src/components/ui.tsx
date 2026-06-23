import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { ApiError } from '../api/client'

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation()
  return <div className="state state-loading">{label ?? t('common.loading')}</div>
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state state-empty">{children}</div>
}

// `error.message` for an ApiError is already localized at throw time (client.ts
// uses i18n) or is a raw backend detail string that must be shown verbatim.
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message
    return `${error.status} — ${error.message}`
  }
  if (error instanceof Error) return error.message
  return i18n.t('common.unknownError')
}

export function ErrorState({ error }: { error: unknown }) {
  const { t } = useTranslation()
  return (
    <div className="state state-error">
      <strong>{t('common.errorPrefix')}</strong> {messageFor(error)}
    </div>
  )
}

// Inline error suited for forms / mutation results.
export function InlineError({ error }: { error: unknown }) {
  return <div className="text-error">{messageFor(error)}</div>
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
