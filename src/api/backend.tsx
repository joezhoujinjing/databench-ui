import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_API_BASE,
  getApiBase,
  getToken,
  normalizeBase,
  setApiBase,
  setToken as persistToken,
} from './config'

// Holds the currently-selected backend in React state so that every query key
// can include it. Changing the base re-keys all queries (no cross-backend data
// bleed) and swaps in that base's namespaced token.

interface BackendContextValue {
  // Normalized origin ("" means current origin). Used as the cache-key prefix.
  base: string
  // Bearer token for the current base ("" if none).
  token: string
  setBase: (value: string) => void
  setToken: (value: string) => void
}

const BackendContext = createContext<BackendContextValue | null>(null)

export function BackendProvider({ children }: { children: ReactNode }) {
  const [base, setBaseState] = useState<string>(() => getApiBase())
  const [token, setTokenState] = useState<string>(() => getToken())

  const setBase = useCallback((value: string) => {
    const next = normalizeBase(value)
    setApiBase(next)
    setBaseState(next)
    // Swap to the token namespaced under the new base (isolation on switch).
    setTokenState(getToken(next))
  }, [])

  const setToken = useCallback(
    (value: string) => {
      persistToken(value, base)
      setTokenState(value.trim())
    },
    [base],
  )

  const value = useMemo<BackendContextValue>(
    () => ({ base, token, setBase, setToken }),
    [base, token, setBase, setToken],
  )

  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>
}

export function useBackend(): BackendContextValue {
  const ctx = useContext(BackendContext)
  if (!ctx) throw new Error('useBackend must be used within a BackendProvider')
  return ctx
}

// A stable cache-key prefix for the active backend. Every server-state query key
// starts with this so switching environments isolates the cache per backend.
export function useBackendKey(): string {
  return useBackend().base
}

export { DEFAULT_API_BASE }
