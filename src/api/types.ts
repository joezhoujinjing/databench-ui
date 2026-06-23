// Types aligned with the databench FastAPI contract. Samples are intentionally
// kept loose (a Record keyed by `kind`) so the UI does not hardcode every
// per-kind subfield — render by `kind` and show the rest generically.

export type SampleKind = 'sft' | 'preference' | 'rl' | 'trajectory'

export interface HealthInfo {
  status: string
  workspace_root: string
}

export interface Manifest {
  version: string
  name?: string | null
  num_rows: number
  kinds: Partial<Record<SampleKind, number>>
  // The backend may attach additional manifest fields; keep them accessible.
  [key: string]: unknown
}

export interface Sample {
  id?: string
  kind?: SampleKind
  [key: string]: unknown
}

export interface SamplesPage {
  total: number
  limit: number
  offset: number
  items: Sample[]
}

// GET /refs -> { name: version }
export type RefsMap = Record<string, string>

export interface TransformInfo {
  name: string
  version: string
  params_schema?: Record<string, unknown> | null
}

export interface TransformRunRequest {
  inputs: string[]
  params: Record<string, unknown>
  ref?: string
}

// Recipe shape is backend-defined; treat as an opaque object the user edits as JSON.
export type Recipe = Record<string, unknown>

export interface MaterializeRequest {
  recipe: Recipe
  ref?: string
}

export interface CreateDatasetRequest {
  name?: string
  message?: string
  samples: Sample[]
}

// Lineage is an arbitrarily nested provenance DAG.
export type Lineage = unknown

export type ExportFormat = 'messages-jsonl'

export type IngestKind = SampleKind
