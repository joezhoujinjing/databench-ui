import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  CreateDatasetRequest,
  IngestKind,
  MaterializeRequest,
  TransformRunRequest,
} from './types'

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 15000,
    retry: false,
  })
}

export function useRefs() {
  return useQuery({ queryKey: ['refs'], queryFn: api.listRefs })
}

export function useDataset(ref: string | undefined) {
  return useQuery({
    queryKey: ['dataset', ref],
    queryFn: () => api.getDataset(ref!),
    enabled: !!ref,
  })
}

export function useSamples(ref: string | undefined, limit: number, offset: number) {
  return useQuery({
    queryKey: ['samples', ref, limit, offset],
    queryFn: () => api.getSamples(ref!, limit, offset),
    enabled: !!ref,
    placeholderData: (prev) => prev,
  })
}

export function useTransforms() {
  return useQuery({ queryKey: ['transforms'], queryFn: api.listTransforms })
}

export function useLineage(ref: string | undefined) {
  return useQuery({
    queryKey: ['lineage', ref],
    queryFn: () => api.getLineage(ref!),
    enabled: !!ref,
    retry: false,
  })
}

export function useCreateDataset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDatasetRequest) => api.createDataset(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['refs'] }),
  })
}

export function useIngestJsonl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      file: File
      name?: string
      kind?: IngestKind
      source?: string
    }) => api.ingestJsonl(vars.file, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['refs'] }),
  })
}

export function useRunTransform() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { name: string; payload: TransformRunRequest }) =>
      api.runTransform(vars.name, vars.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['refs'] }),
  })
}

export function useMaterializeRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MaterializeRequest) => api.materializeRecipe(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['refs'] }),
  })
}
