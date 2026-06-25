import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api, DEFAULT_PAGE_LIMIT } from './client'
import { useBackendKey } from './backend'
import { ApiError } from './http'
import type {
  Extractor,
  IngestKind,
  IngestSamplesRequest,
  MaterializeRequest,
  SamplesPage,
  TransformRunRequest,
  VocabularyInput,
} from './types'

// Every query key begins with the active backend base so switching environments
// never serves cached data from a different backend.

// Treat "feature not deployed" responses as a soft, non-retryable signal so the
// UI can render a friendly disabled/empty state instead of an error.
function isNotDeployed(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 501)
}

export function useHealth() {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'health'],
    queryFn: api.health,
    refetchInterval: 15000,
    retry: false,
  })
}

export function useRefs(limit = 200) {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'refs', limit],
    queryFn: () => api.listRefs(limit, 0),
  })
}

export function useDataset(ref: string | undefined) {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'dataset', ref],
    queryFn: () => api.getDataset(ref!),
    enabled: !!ref,
  })
}

// Page-at-a-time samples (classic prev/next).
export function useSamples(ref: string | undefined, limit: number, offset: number) {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'samples', ref, limit, offset],
    queryFn: () => api.getSamples(ref!, limit, offset),
    enabled: !!ref,
    placeholderData: (prev) => prev,
  })
}

// Lazy-loading samples for the virtualized table: fetch a page at a time and let
// the table request the next page as the user scrolls. Never pulls the whole set.
export function useInfiniteSamples(ref: string | undefined, pageSize = DEFAULT_PAGE_LIMIT) {
  const base = useBackendKey()
  return useInfiniteQuery({
    queryKey: [base, 'samples-infinite', ref, pageSize],
    enabled: !!ref,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.getSamples(ref!, pageSize, pageParam, signal),
    getNextPageParam: (last: SamplesPage) => {
      const next = last.offset + last.limit
      return next < last.total ? next : undefined
    },
  })
}

export function useTransforms() {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'transforms'],
    queryFn: () => api.listTransforms(),
    retry: (count, error) => !isNotDeployed(error) && count < 1,
  })
}

export function useLineage(ref: string | undefined) {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'lineage', ref],
    queryFn: () => api.getLineage(ref!),
    enabled: !!ref,
    retry: (count, error) => !isNotDeployed(error) && count < 1,
  })
}

export function useVocabularies() {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'vocabularies'],
    queryFn: () => api.listVocabularies(),
    retry: (count, error) => !isNotDeployed(error) && count < 1,
  })
}

export function useVocabulary(name: string | undefined) {
  const base = useBackendKey()
  return useQuery({
    queryKey: [base, 'vocabulary', name],
    queryFn: () => api.getVocabulary(name!),
    enabled: !!name,
  })
}

function useVocabulariesInvalidation() {
  const qc = useQueryClient()
  const base = useBackendKey()
  return () => qc.invalidateQueries({ queryKey: [base, 'vocabularies'] })
}

export function useDeriveVocabulary() {
  const invalidate = useVocabulariesInvalidation()
  return useMutation({
    mutationFn: (vars: {
      name: string
      dataset: string
      dimension: string
      extractor?: Extractor
    }) => api.deriveVocabulary(vars.name, vars),
    onSuccess: invalidate,
  })
}

export function usePutVocabulary() {
  const invalidate = useVocabulariesInvalidation()
  const qc = useQueryClient()
  const base = useBackendKey()
  return useMutation({
    mutationFn: (vars: { name: string; payload: VocabularyInput }) =>
      api.putVocabulary(vars.name, vars.payload),
    onSuccess: (_data, vars) => {
      invalidate()
      qc.invalidateQueries({ queryKey: [base, 'vocabulary', vars.name] })
    },
  })
}

function useRefsInvalidation() {
  const qc = useQueryClient()
  const base = useBackendKey()
  return () => qc.invalidateQueries({ queryKey: [base, 'refs'] })
}

// normalize/validate both persist a new content-addressed dataset, so a success
// should refresh the refs list. The extractor body is never sent — the server
// resolves it from the vocab's meta.extractor or a dimension preset.
export function useNormalizeVocabulary() {
  const invalidate = useRefsInvalidation()
  return useMutation({
    mutationFn: (vars: { name: string; dataset: string; ref?: string }) =>
      api.normalizeVocabulary(vars.name, vars),
    onSuccess: invalidate,
  })
}

export function useValidateVocabulary() {
  const invalidate = useRefsInvalidation()
  return useMutation({
    mutationFn: (vars: { name: string; dataset: string; ref?: string }) =>
      api.validateVocabulary(vars.name, vars),
    onSuccess: invalidate,
  })
}

export function useCreateDataset() {
  const invalidate = useRefsInvalidation()
  return useMutation({
    mutationFn: (payload: IngestSamplesRequest) => api.createDataset(payload),
    onSuccess: invalidate,
  })
}

export function useIngestJsonl() {
  const invalidate = useRefsInvalidation()
  return useMutation({
    mutationFn: (vars: { file: File; name?: string; kind?: IngestKind; source?: string }) =>
      api.ingestJsonl(vars.file, vars),
    onSuccess: invalidate,
  })
}

export function useRunTransform() {
  const invalidate = useRefsInvalidation()
  return useMutation({
    mutationFn: (vars: { name: string; payload: TransformRunRequest }) =>
      api.runTransform(vars.name, vars.payload),
    onSuccess: invalidate,
  })
}

export function useMaterializeRecipe() {
  const invalidate = useRefsInvalidation()
  return useMutation({
    mutationFn: (payload: MaterializeRequest) => api.materializeRecipe(payload),
    onSuccess: invalidate,
  })
}
