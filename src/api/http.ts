import i18n from '../i18n'
import { getApiBase, getToken } from './config'

// A typed error carrying HTTP status plus the backend's unified error envelope
// fields. The backend returns errors as { error: { code, message, detail? } };
// we also tolerate FastAPI's legacy { detail: ... } shape for robustness.
export class ApiError extends Error {
  status: number
  code: string
  detail: unknown

  constructor(status: number, code: string, message: string, detail: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

export interface RequestOptions {
  method?: string
  query?: Query
  // A JSON-serializable body. Mutually exclusive with `form`.
  json?: unknown
  // A multipart body (file uploads). Mutually exclusive with `json`.
  form?: FormData
  signal?: AbortSignal
}

// Build an absolute URL from the configured origin + an app path. The path is
// expected to already include its prefix ("/v1/..." or a meta route). If the
// configured base is empty we stay same-origin (relative URL).
export function buildUrl(path: string, query?: Query): string {
  const base = getApiBase()
  const p = path.startsWith('/') ? path : `/${path}`
  let url = `${base}${p}`
  if (query) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) qs.set(k, String(v))
    }
    const s = qs.toString()
    if (s) url += `?${s}`
  }
  return url
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Pull a human message + machine code out of whatever error shape came back.
function describeError(status: number, body: unknown): { code: string; message: string } {
  if (body && typeof body === 'object') {
    // Unified envelope: { error: { code, message, detail? } }
    const env = (body as { error?: unknown }).error
    if (env && typeof env === 'object') {
      const code = String((env as { code?: unknown }).code ?? `http_${status}`)
      const message = String((env as { message?: unknown }).message ?? '')
      if (message) return { code, message }
    }
    // Legacy FastAPI: { detail: string | ValidationError[] }
    const detail = (body as { detail?: unknown }).detail
    if (typeof detail === 'string' && detail) return { code: `http_${status}`, message: detail }
    if (Array.isArray(detail)) {
      const parts = detail
        .map((d) => {
          if (d && typeof d === 'object') {
            const loc = Array.isArray((d as { loc?: unknown[] }).loc)
              ? (d as { loc: unknown[] }).loc.join('.')
              : ''
            const msg = (d as { msg?: string }).msg ?? ''
            return loc ? `${loc}: ${msg}` : msg
          }
          return String(d)
        })
        .filter(Boolean)
      if (parts.length) return { code: `http_${status}`, message: parts.join('; ') }
    }
  }
  const fallback: Record<number, string> = {
    400: i18n.t('errors.badRequest'),
    404: i18n.t('errors.notFound'),
    422: i18n.t('errors.validation'),
    501: i18n.t('errors.notImplemented'),
  }
  return { code: `http_${status}`, message: fallback[status] ?? i18n.t('errors.generic', { status }) }
}

async function parseBody(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }
  try {
    return await res.text()
  } catch {
    return null
  }
}

// Low-level fetch that returns the raw Response (used for streaming downloads).
export async function rawRequest(path: string, opts: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { ...authHeaders() }
  let body: BodyInit | undefined
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.json)
  } else if (opts.form) {
    body = opts.form
  }
  try {
    return await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body,
      signal: opts.signal,
    })
  } catch (cause) {
    // Network-level failure (backend down, CORS, DNS) — no HTTP status.
    throw new ApiError(0, 'unreachable', i18n.t('errors.unreachable'), cause)
  }
}

// Typed JSON request. Throws ApiError on non-2xx.
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, opts)
  const body = await parseBody(res)
  if (!res.ok) {
    const { code, message } = describeError(res.status, body)
    throw new ApiError(res.status, code, message, body)
  }
  return body as T
}
