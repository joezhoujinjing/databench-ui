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
// Returns null for missing/non-string/unparseable inputs so the caller can
// treat them as unsupported instead of crashing.
function majorOf(version: unknown): number | null {
  if (typeof version !== 'string' || version.length === 0) return null
  const m = version.trim().match(/^v?(\d+)/i)
  return m ? Number(m[1]) : null
}

// Compare dotted numeric versions (e.g. "0.1.0" vs "0.2"). Missing parts -> 0.
// Coerces non-string inputs so a malformed payload never throws here.
function compareSemver(a: unknown, b: unknown): number {
  const pa = String(a ?? '').trim().replace(/^v/i, '').split('.').map((n) => Number(n) || 0)
  const pb = String(b ?? '').trim().replace(/^v/i, '').split('.').map((n) => Number(n) || 0)
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
    // Coerce so a missing/non-string value still renders safely in the banner.
    const apiVersion =
      typeof caps.api_version === 'string' ? caps.api_version : String(caps.api_version ?? '')
    return { ok: false, reason: 'api_unsupported', apiVersion }
  }
  // Only enforce a minimum-client gate when the backend actually supplies one.
  const minClient = caps.min_client
  if (typeof minClient === 'string' && minClient.trim() !== '') {
    if (compareSemver(CLIENT_VERSION, minClient) < 0) {
      return { ok: false, reason: 'client_too_old', minClient }
    }
  }
  return { ok: true }
}
