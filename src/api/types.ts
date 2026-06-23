// Domain types are re-exported from the generated OpenAPI client
// (src/api/generated/schema.ts). That file is build output regenerated from the
// pinned schema/openapi.json and must never be hand-edited. Everything below is
// either a thin alias over a generated schema or an app-only type that has no
// representation on the wire.

import type { components } from './generated/schema'

type Schemas = components['schemas']

export type Capabilities = Schemas['Capabilities']
export type VersionInfo = Schemas['VersionInfo']
export type Manifest = Schemas['Manifest']
export type RefInfo = Schemas['RefInfo']
export type RefsPage = Schemas['RefsPage']
export type TransformInfo = Schemas['TransformInfo']
export type TransformsPage = Schemas['TransformsPage']
export type TransformRunRequest = Schemas['TransformRunRequest']
export type SamplesPage = Schemas['SamplesPage']
export type IngestSamplesRequest = Schemas['IngestSamplesRequest']
export type MaterializeRequest = Schemas['MaterializeRequest']
export type Recipe = Schemas['Recipe']
export type SFTSample = Schemas['SFTSample']
export type PreferenceSample = Schemas['PreferenceSample']
export type RLSample = Schemas['RLSample']
export type TrajectorySample = Schemas['TrajectorySample']
export type Message = Schemas['Message']

// A sample is the discriminated union the backend returns. We keep an index
// signature so the UI can read fields generically (tolerant reads) without
// having to narrow on `kind` for every access.
export type Sample = (
  | SFTSample
  | PreferenceSample
  | RLSample
  | TrajectorySample
) & { id?: string; [key: string]: unknown }

export type SampleKind = NonNullable<Sample['kind']>

// /health returns an open string->string map; surface it as such.
export type HealthInfo = Record<string, string>

// Lineage is an arbitrarily nested provenance object.
export type Lineage = Record<string, unknown>

export type ExportFormat = 'messages-jsonl' | 'trl'

export type IngestKind = SampleKind
