import type { Capabilities } from './types'

// The frontend client version. Compared against the backend's `min_client`.
export const CLIENT_VERSION = '0.1.0'

// Major API versions this client can speak. The client builds /v1 URLs, so it
// supports major version 1. Add majors here when the client learns new prefixes.
export const SUPPORTED_API_MAJORS = [1]

export type Compatibility =
  | { ok: true }
  | { ok: false; reason: 'api_unsupported'; apiVersion: string }
  | { ok: false; reason: 'client_too_old'; minClient: string }

// Extract the integer major from version strings like "v1", "1", "1.4.0".
function majorOf(version: string): number | null {
  const m = version.trim().match(/^v?(\d+)/i)
  return m ? Number(m[1]) : null
}

// Compare dotted numeric versions (e.g. "0.1.0" vs "0.2"). Missing parts -> 0.
function compareSemver(a: string, b: string): number {
  const pa = a.trim().replace(/^v/i, '').split('.').map((n) => Number(n) || 0)
  const pb = b.trim().replace(/^v/i, '').split('.').map((n) => Number(n) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  return 0
}

export function checkCompatibility(caps: Capabilities): Compatibility {
  const apiMajor = majorOf(caps.api_version)
  if (apiMajor === null || !SUPPORTED_API_MAJORS.includes(apiMajor)) {
    return { ok: false, reason: 'api_unsupported', apiVersion: caps.api_version }
  }
  if (compareSemver(CLIENT_VERSION, caps.min_client) < 0) {
    return { ok: false, reason: 'client_too_old', minClient: caps.min_client }
  }
  return { ok: true }
}
