# databench-ui

Web console for the databench service API — a control panel for browsing
content-addressed, immutable datasets, ingesting data, running transforms,
materializing recipes, and inspecting lineage.

Built with **Vite + React + TypeScript**, **react-router**, and
**@tanstack/react-query** (server state). The API client is **generated from the
pinned OpenAPI schema** (`schema/openapi.json`) — see [API client](#api-client).

## API client

The backend's OpenAPI document is the single source of truth. A pinned copy lives
at `schema/openapi.json`, and the typed client is generated from it with
[`openapi-typescript`](https://github.com/openapi-ts/openapi-typescript):

```bash
npm run gen:client        # regenerate src/api/generated/schema.ts from the pinned schema
npm run gen:client:check  # regenerate + fail if it drifts from what's committed (CI gate)
```

`src/api/generated/schema.ts` is **build output** — never hand-edit it. We chose
`openapi-typescript` (types only) plus a thin hand-written fetch wrapper
(`src/api/http.ts`) over a full client generator (e.g. orval) because the wrapper
needs to own runtime concerns the generator can't: a runtime-configurable origin,
per-environment bearer tokens, the unified error envelope, and TanStack Query
cache keys that include the active backend. Domain types are re-exported from the
generated schema through `src/api/types.ts`.

## Contract highlights

- **Endpoint-only base.** The configured API base is an **origin only** (e.g.
  `http://127.0.0.1:8000`, or blank for same-origin); the client appends `/v1/…`
  for domain routes and calls the unversioned meta routes (`/health`, `/version`,
  `/capabilities`) directly. Configured at **runtime** from the connection panel
  (persisted in `localStorage` under `databench.api_base`) — not a build-time var.
- **Per-environment tokens.** A bearer token is stored namespaced per base, so
  switching environments swaps to that backend's token (no credential bleed).
- **Capability-driven UI.** On connect the app fetches `/capabilities` + `/version`.
  Modules are shown/hidden from the `features` map, and the service/api versions are
  surfaced in the top-bar connection panel. If the backend's `api_version` is
  unsupported or the client is older than `min_client`, a clear message is shown
  instead of a blank screen.
- **Backend-keyed cache.** Every TanStack Query key is prefixed with the active
  base URL, so switching environments never serves data from a different backend.
- **Tolerant reads.** Unknown response fields are ignored, optionals tolerated, and
  `404`/`501` (a not-deployed feature) renders a friendly disabled/empty state.
- **Unified errors.** Backend errors (`{ error: { code, message, detail? } }`) are
  parsed and surfaced as `code — message` consistently.
- **Big-data UX.** Sample views paginate (server cap 500/page, default 20) with a
  **virtualized, lazy-loading** table; full pulls go through the streaming NDJSON
  **export** download.

## Internationalization (i18n)

Bilingual (English / 简体中文) via **react-i18next**. All UI strings go through
`t()`; backend data (names, versions, sample content, lineage) renders verbatim.
Translations live in `src/i18n/locales/{en,zh}.json`; add new keys to **both**.
The language switcher is in the top bar; the choice persists in `localStorage`
(`databench.lang`).

## Prerequisites

- Node.js 18+ (developed on Node 20)
- The databench FastAPI backend exposing the `/v1` contract.

## Install & run

```bash
npm install
npm run dev      # http://localhost:5173
```

### Connecting to the backend

The API base defaults to the **current origin**. In dev, the Vite server proxies
the `/v1` domain routes plus the meta routes (`/health`, `/version`,
`/capabilities`) to the backend (default `http://127.0.0.1:8000`). Point the proxy
elsewhere with:

```bash
VITE_PROXY_TARGET=http://127.0.0.1:8001 npm run dev
```

Or set the base **at runtime** from the connection panel (top-right) to talk to a
backend directly — useful for switching environments without a rebuild. The panel
also takes a per-backend bearer token. See `.env.example`.

If the backend is unreachable the panel shows **disconnected** and the app renders
a readable message instead of a blank screen.

## Build

```bash
npm run typecheck   # tsc -b
npm run build       # tsc -b && vite build  ->  dist/
```

## CI

`.github/workflows/ci.yml` installs deps, regenerates the client from
`schema/openapi.json` and fails on drift, then runs typecheck and the production
build — the frontend half of the cross-repo schema-drift gate.

## Project layout

```
schema/openapi.json         # pinned backend contract (single source of truth)
vite.config.ts              # dev server proxy for /v1 + meta routes
src/
  main.tsx                  # bootstrap: QueryClient, BackendProvider, CapabilitiesProvider, Router
  App.tsx                   # top bar, feature-gated nav, version gate, routes
  api/
    generated/schema.ts     # GENERATED from schema/openapi.json (do not edit)
    types.ts                # domain types re-exported from the generated schema
    config.ts               # runtime origin-only base + per-base token storage
    http.ts                 # typed fetch wrapper, auth, error-envelope parsing
    client.ts               # typed /v1 + meta API surface, export download
    backend.tsx             # active-backend context (drives cache-keying)
    capabilities.tsx        # /capabilities + /version context, feature gating
    version.ts              # client version + compatibility check
    hooks.ts                # backend-keyed react-query hooks (incl. infinite samples)
  components/
    ConnectionPanel.tsx     # base + token config, status, version surface
    VirtualizedSamples.tsx  # lazy, virtualized sample browser
    LanguageSwitcher.tsx ManifestView.tsx SampleView.tsx TreeNode.tsx ui.tsx
  pages/
    DatasetsPage.tsx DatasetDetailPage.tsx IngestPage.tsx
    TransformsPage.tsx RecipePage.tsx LineagePage.tsx
  i18n/                     # i18next config + en/zh locales
```
</content>
