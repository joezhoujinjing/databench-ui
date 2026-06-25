# Changelog

All notable changes to databench-ui are documented here. The format loosely
follows [Keep a Changelog](https://keepachangelog.com/), and the project uses
[Semantic Versioning](https://semver.org/). The release pipeline derives the
GitHub Release notes from the latest section below (see `RELEASING.md`).

## [0.2.1] - 2026-06-25

### Fixed
- Connection panel no longer white-screens when the backend returns a partial
  `/capabilities` payload missing the `features` object. Opening the panel ran
  `Object.entries(capabilities.features)` on `undefined`; the feature-flag list
  now coerces a missing/non-object `features` to empty and renders no badges
  instead of crashing. Same partial-backend degradation theme as the 0.2.0
  version-gate fix.

## [0.2.0] - 2026-06-25

### Fixed
- Version gate no longer white-screens the app when the backend returns a
  partial `/capabilities` payload. A missing/non-string `api_version` now
  surfaces the existing incompatibility banner instead of throwing, and a
  missing `min_client` is treated as "no enforced minimum" rather than crashing.

### Changed
- First-time visitors now default to Chinese (`zh`). The EN/中文 toggle and its
  persisted choice (localStorage `databench.lang`) are unchanged — a returning
  user who picked English still gets English.

## [0.1.0] - 2026-06-25

Initial release of the databench console — a capability-driven web UI over the
databench `/v1` HTTP contract.

### Added
- Capability-driven shell: a connection panel for the backend base/token, a
  version-compatibility gate, and nav that hides modules the backend doesn't
  advertise. en/zh internationalization throughout.
- Typed API client generated from the pinned OpenAPI schema, with a build-time
  schema-drift gate keeping the client in sync with the contract.
- Datasets: browse refs, inspect a dataset manifest, lazily page through samples
  in a virtualized table, and stream a JSONL export.
- Ingest: upload a `.jsonl` file or create a dataset from a JSON sample array.
- Transforms: list registered transforms and run one against input refs.
- Recipe: materialize a recipe object into a dataset.
- Lineage: inspect the provenance DAG for a ref or version.
- Vocabulary: list and detail views with virtualized terms and an
  alias-conflict "needs review" surface; derive a draft from a dataset's labels;
  curate (edit terms/aliases) and promote draft → curated; build a vocabulary
  by hand from scratch; and apply a vocabulary to a dataset via validate
  (off-vocabulary report) and normalize (rewrite labels to canonical).
