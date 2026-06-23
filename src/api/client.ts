import i18n from '../i18n'
import type {
  CreateDatasetRequest,
  ExportFormat,
  HealthInfo,
  IngestKind,
  Lineage,
  Manifest,
  MaterializeRequest,
  RefsMap,
  SamplesPage,
  TransformInfo,
  TransformRunRequest,
} from './types'

const ENV_API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/+$/, '')
const OVERRIDE_KEY = 'databench.apiBase'

// The API base can be overridden at runtime from the top bar (persisted in
// localStorage), falling back to the build-time VITE_API_BASE, then '/api'.
export function getApiBase(): string {
  try {
    const override = localStorage.getItem(OVERRIDE_KEY)
    if (override && override.trim()) return override.trim().replace(/\/+$/, '')
  } catch {
    // localStorage may be unavailable (SSR / privacy mode) — ignore.
  }
  return ENV_API_BASE
}

export function setApiBase(value: string): void {
  try {
    const trimmed = value.trim()
    if (trimmed) localStorage.setItem(OVERRIDE_KEY, trimmed)
    else localStorage.removeItem(OVERRIDE_KEY)
  } catch {
    // ignore
  }
}

export const DEFAULT_API_BASE = ENV_API_BASE

// A typed error carrying HTTP status + a human-readable message extracted from
// the FastAPI error body (404 not found / 422 validation / 400 parse).
export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, message: string, detail: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

function joinUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`
}

// FastAPI errors usually look like { detail: "..."} or { detail: [{loc, msg, ...}] }.
function describeDetail(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
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
      if (parts.length) return parts.join('; ')
    }
  }
  const reasons: Record<number, string> = {
    400: i18n.t('errors.badRequest'),
    404: i18n.t('errors.notFound'),
    422: i18n.t('errors.validation'),
  }
  return reasons[status] ?? i18n.t('errors.generic', { status })
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(joinUrl(path), init)
  } catch (cause) {
    // Network-level failure (backend down, CORS, etc.) — no HTTP status.
    throw new ApiError(0, i18n.t('errors.unreachable'), cause)
  }

  const body = await parseBody(res)
  if (!res.ok) {
    throw new ApiError(res.status, describeDetail(res.status, body), body)
  }
  return body as T
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

export const api = {
  health: () => request<HealthInfo>('/health'),

  listRefs: () => request<RefsMap>('/refs'),
  getRef: (name: string) => request<string>(`/refs/${encodeURIComponent(name)}`),

  getDataset: (ref: string) => request<Manifest>(`/datasets/${encodeURIComponent(ref)}`),

  getSamples: (ref: string, limit: number, offset: number) =>
    request<SamplesPage>(
      `/datasets/${encodeURIComponent(ref)}/samples?limit=${limit}&offset=${offset}`,
    ),

  createDataset: (payload: CreateDatasetRequest) =>
    request<Manifest>('/datasets', jsonInit('POST', payload)),

  ingestJsonl: (
    file: File,
    opts: { name?: string; kind?: IngestKind; source?: string },
  ) => {
    const params = new URLSearchParams()
    if (opts.name) params.set('name', opts.name)
    if (opts.kind) params.set('kind', opts.kind)
    if (opts.source) params.set('source', opts.source)
    const qs = params.toString()
    const form = new FormData()
    form.append('file', file)
    return request<Manifest>(`/datasets:ingest-jsonl${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: form,
    })
  },

  listTransforms: () => request<TransformInfo[]>('/transforms'),

  runTransform: (name: string, payload: TransformRunRequest) =>
    request<Manifest>(`/transforms/${encodeURIComponent(name)}/run`, jsonInit('POST', payload)),

  materializeRecipe: (payload: MaterializeRequest) =>
    request<Manifest>('/recipes:materialize', jsonInit('POST', payload)),

  getLineage: (ref: string) => request<Lineage>(`/lineage/${encodeURIComponent(ref)}`),

  // Absolute URL for the streaming export download (used in an <a href>).
  exportUrl: (ref: string, fmt: ExportFormat = 'messages-jsonl') =>
    joinUrl(`/datasets/${encodeURIComponent(ref)}/export?fmt=${fmt}`),
}
