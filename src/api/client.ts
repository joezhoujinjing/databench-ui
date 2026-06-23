// Typed API surface over the databench /v1 contract. Domain routes live under
// /v1; the meta routes (/health, /version, /capabilities) are unversioned. The
// origin is supplied at runtime by config.ts — these functions only know paths.

import { buildUrl, rawRequest, request } from './http'
import type {
  Capabilities,
  ExportFormat,
  HealthInfo,
  IngestKind,
  IngestSamplesRequest,
  Lineage,
  Manifest,
  MaterializeRequest,
  RefInfo,
  RefsPage,
  SamplesPage,
  TransformRunRequest,
  TransformsPage,
  VersionInfo,
} from './types'

const V1 = '/v1'

// Server cap on page size (see schema: limit maximum). Defensive clamp so we
// never ask for more than the backend will return.
export const MAX_PAGE_LIMIT = 500
export const DEFAULT_PAGE_LIMIT = 20

function clampLimit(limit: number): number {
  return Math.max(1, Math.min(MAX_PAGE_LIMIT, Math.floor(limit)))
}

export const api = {
  // ---- meta (unversioned) ----
  health: () => request<HealthInfo>('/health'),
  version: () => request<VersionInfo>('/version'),
  capabilities: () => request<Capabilities>('/capabilities'),

  // ---- refs ----
  listRefs: (limit = DEFAULT_PAGE_LIMIT, offset = 0) =>
    request<RefsPage>(`${V1}/refs`, { query: { limit: clampLimit(limit), offset } }),
  getRef: (name: string) => request<RefInfo>(`${V1}/refs/${encodeURIComponent(name)}`),

  // ---- datasets ----
  getDataset: (ref: string) => request<Manifest>(`${V1}/datasets/${encodeURIComponent(ref)}`),

  getSamples: (ref: string, limit = DEFAULT_PAGE_LIMIT, offset = 0, signal?: AbortSignal) =>
    request<SamplesPage>(`${V1}/datasets/${encodeURIComponent(ref)}/samples`, {
      query: { limit: clampLimit(limit), offset },
      signal,
    }),

  createDataset: (payload: IngestSamplesRequest) =>
    request<Manifest>(`${V1}/datasets`, { method: 'POST', json: payload }),

  ingestJsonl: (file: File, opts: { name?: string; kind?: IngestKind; source?: string }) => {
    const form = new FormData()
    form.append('file', file)
    return request<Manifest>(`${V1}/datasets:ingest-jsonl`, {
      method: 'POST',
      form,
      query: { name: opts.name, kind: opts.kind, source: opts.source },
    })
  },

  // ---- transforms ----
  listTransforms: (limit = MAX_PAGE_LIMIT, offset = 0) =>
    request<TransformsPage>(`${V1}/transforms`, { query: { limit: clampLimit(limit), offset } }),

  runTransform: (name: string, payload: TransformRunRequest) =>
    request<Manifest>(`${V1}/transforms/${encodeURIComponent(name)}/run`, {
      method: 'POST',
      json: payload,
    }),

  // ---- recipes ----
  materializeRecipe: (payload: MaterializeRequest) =>
    request<Manifest>(`${V1}/recipes:materialize`, { method: 'POST', json: payload }),

  // ---- lineage ----
  getLineage: (ref: string) =>
    request<Lineage>(`${V1}/lineage/${encodeURIComponent(ref)}`),

  // ---- export (streaming NDJSON) ----
  // URL is exposed for display; the actual download goes through downloadExport
  // so the bearer token can be attached (a plain <a download> cannot set headers).
  exportUrl: (ref: string, fmt: ExportFormat = 'messages-jsonl') =>
    buildUrl(`${V1}/datasets/${encodeURIComponent(ref)}/export`, { fmt }),

  exportResponse: (ref: string, fmt: ExportFormat = 'messages-jsonl', signal?: AbortSignal) =>
    rawRequest(`${V1}/datasets/${encodeURIComponent(ref)}/export`, { query: { fmt }, signal }),
}

// Authenticated streaming download: fetch with the bearer token, then save the
// streamed NDJSON as a file. Never pulls the dataset into app state beyond the
// blob the browser is about to write to disk.
export async function downloadExport(
  ref: string,
  fmt: ExportFormat = 'messages-jsonl',
): Promise<void> {
  const res = await api.exportResponse(ref, fmt)
  if (!res.ok) {
    // Surface the same envelope-aware error as a normal request.
    await request(`${V1}/datasets/${encodeURIComponent(ref)}/export`, { query: { fmt } })
    return
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ref.replace(/[^\w.-]+/g, '_')}.${fmt}.jsonl`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
