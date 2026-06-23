import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from './client'
import { useBackendKey } from './backend'
import { checkCompatibility, type Compatibility } from './version'
import type { Capabilities, VersionInfo } from './types'

interface CapabilitiesContextValue {
  capabilities: Capabilities | undefined
  version: VersionInfo | undefined
  compatibility: Compatibility | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
  // True only once we have capabilities AND they are compatible.
  ready: boolean
  refetch: () => void
}

const CapabilitiesContext = createContext<CapabilitiesContextValue | null>(null)

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const base = useBackendKey()

  const caps: UseQueryResult<Capabilities> = useQuery({
    queryKey: [base, 'capabilities'],
    queryFn: api.capabilities,
    retry: false,
    refetchInterval: 30000,
  })

  const version: UseQueryResult<VersionInfo> = useQuery({
    queryKey: [base, 'version'],
    queryFn: api.version,
    retry: false,
  })

  const compatibility = caps.data ? checkCompatibility(caps.data) : undefined

  const value: CapabilitiesContextValue = {
    capabilities: caps.data,
    version: version.data,
    compatibility,
    isLoading: caps.isLoading,
    isError: caps.isError,
    error: caps.error,
    ready: !!compatibility?.ok,
    refetch: () => {
      caps.refetch()
      version.refetch()
    },
  }

  return <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>
}

export function useCapabilities(): CapabilitiesContextValue {
  const ctx = useContext(CapabilitiesContext)
  if (!ctx) throw new Error('useCapabilities must be used within a CapabilitiesProvider')
  return ctx
}

// Known per-module feature flags emitted by the backend's /capabilities.
export const FEATURES = {
  transforms: 'transforms',
  recipes: 'recipes',
  lineage: 'lineage',
  jsonlIngest: 'jsonl_ingest',
  export: 'export',
} as const

// Strict check: true only when the backend explicitly reports the feature on.
export function useFeature(name: string): boolean {
  const { capabilities } = useCapabilities()
  return capabilities?.features?.[name] ?? false
}

// Tolerant check used for navigation/visibility: a module stays visible unless
// the backend explicitly reports it disabled. Before capabilities load we
// optimistically show everything so the UI never flashes empty.
export function useModuleEnabled(name: string): boolean {
  const { capabilities } = useCapabilities()
  if (!capabilities) return true
  return capabilities.features?.[name] !== false
}
