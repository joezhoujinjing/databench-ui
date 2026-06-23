// Runtime configuration for which backend we talk to.
//
// The API base is an ORIGIN ONLY (e.g. "http://127.0.0.1:8000" or "" for the
// current origin) — never a path. The HTTP layer appends "/v1/..." (or the
// unversioned meta routes) itself. Configuration lives in localStorage so it is
// editable at runtime from the UI, NOT baked in at build time.

const BASE_KEY = 'databench.api_base'
const TOKEN_PREFIX = 'databench.token:'

// Same-origin by default; in dev the Vite proxy forwards /v1 + meta routes.
export const DEFAULT_API_BASE = ''

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    // localStorage may be unavailable (privacy mode / SSR) — ignore.
    return null
  }
}

function writeLS(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

// Strip any trailing slashes; an empty string means "current origin".
export function normalizeBase(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

export function getApiBase(): string {
  const stored = readLS(BASE_KEY)
  if (stored !== null) return normalizeBase(stored)
  return DEFAULT_API_BASE
}

export function setApiBase(value: string): void {
  const normalized = normalizeBase(value)
  if (normalized) writeLS(BASE_KEY, normalized)
  else writeLS(BASE_KEY, null)
}

// Tokens are namespaced per base so switching environments never leaks a
// credential from one backend to another. The token for base A is simply a
// different localStorage key than the token for base B.
function tokenKey(base: string): string {
  return `${TOKEN_PREFIX}${normalizeBase(base) || '(origin)'}`
}

export function getToken(base: string = getApiBase()): string {
  return (readLS(tokenKey(base)) ?? '').trim()
}

export function setToken(token: string, base: string = getApiBase()): void {
  const trimmed = token.trim()
  if (trimmed) writeLS(tokenKey(base), trimmed)
  else writeLS(tokenKey(base), null)
}

export function clearToken(base: string = getApiBase()): void {
  writeLS(tokenKey(base), null)
}
