# databench-ui

Web console for the databench service API — a control panel for browsing
content-addressed, immutable datasets, ingesting data, running transforms,
materializing recipes, and inspecting lineage.

Built with **Vite + React + TypeScript**, **react-router**, and
**@tanstack/react-query** (server state). The API layer is a single typed client
in `src/api/`; every request goes through it.

## Features

- **Health bar** — shows live `/health` status (connected / disconnected /
  checking). Click it to configure the API base URL at runtime.
- **Datasets / Refs** — lists `/refs`; filter, open a ref/version, jump to lineage.
- **Dataset detail** — Manifest (version / name / num_rows / kinds), paginated
  sample preview (`/samples`, limit+offset) with kind-aware rendering, and an
  **Export JSONL** button (`/export`).
- **Ingest** — two paths: upload a `.jsonl` file (`/datasets:ingest-jsonl`, with
  optional name/kind/source) or paste a JSON array of samples (`/datasets`).
- **Transforms** — lists `/transforms`; run one with inputs + optional params JSON
  + optional output ref (`/transforms/{name}/run`).
- **Recipe** — paste a recipe JSON and materialize it (`/recipes:materialize`).
- **Lineage** — load `/lineage/{ref}` and browse the provenance DAG as a
  collapsible tree (or raw JSON).

All pages handle loading / empty states and surface readable errors for
404 (not found), 422 (validation), 400 (parse), and backend-unreachable.

## Internationalization (i18n)

The UI is bilingual (English / 简体中文) via **react-i18next**.

- **Translations** live in `src/i18n/locales/en.json` and `zh.json`. All UI chrome
  (nav, buttons, labels, titles, loading/error/empty states) goes through `t()`;
  no UI strings are hardcoded in components.
- **Backend data is never translated** — dataset names, versions, transform names,
  sample content, and lineage contents render verbatim.
- **Language switcher** (EN / 中文) sits in the top bar; switching is instant.
- **Default language** follows the browser (`navigator.language`), falling back to
  English when unsupported. The choice is persisted in `localStorage`
  (`databench.lang`).
- Config: `src/i18n/index.ts`. To add UI strings, add the key to **both** locale
  files and reference it via `t('key')`.

## Prerequisites

- Node.js 18+ (developed on Node 20)
- The databench FastAPI backend (Swagger at `/docs`), by default on
  `http://127.0.0.1:8000`.

## Install

```bash
npm install
```

## Run (dev)

```bash
npm run dev
```

Opens on http://localhost:5173.

### Connecting to the backend

The frontend talks to the API base in `VITE_API_BASE`, which **defaults to
`/api`**. In dev, the Vite server proxies `/api` → `http://127.0.0.1:8000`
(stripping the `/api` prefix), so no extra config is needed if the backend runs
on that address.

To point the dev proxy at a different backend:

```bash
VITE_PROXY_TARGET=http://localhost:9000 npm run dev
```

To skip the proxy and call a backend directly (e.g. for `npm run preview` or a
deployed build), set the API base to an absolute URL:

```bash
echo 'VITE_API_BASE=http://127.0.0.1:8000' > .env.local
```

You can also override the API base **at runtime** from the health badge in the
top-right (persisted in `localStorage`) — useful for quickly switching backends
without rebuilding. "Reset to default" clears the override.

See `.env.example` for the available variables.

### Backend not running?

The UI degrades gracefully: the health badge shows **disconnected**, and pages
render a readable error instead of a blank screen.

## Build

```bash
npm run build
```

Runs `tsc -b` (type-check, must be error-free) then `vite build`, emitting static
assets to `dist/`. Preview the production build with `npm run preview`.

## Project layout

```
index.html
vite.config.ts            # dev server + /api proxy
src/
  main.tsx                # app bootstrap (QueryClient, Router)
  App.tsx                 # top bar + routes
  styles.css
  api/
    types.ts              # Manifest, Sample, TransformInfo, SamplesPage, …
    client.ts             # typed fetch client + ApiError + runtime API base
    hooks.ts              # react-query hooks
  i18n/
    index.ts              # i18next config (browser detect + localStorage)
    locales/en.json
    locales/zh.json
  components/
    HealthBadge.tsx       # /health status + API base config
    LanguageSwitcher.tsx  # EN / 中文 toggle
    ManifestView.tsx
    SampleView.tsx        # kind-aware sample rendering
    TreeNode.tsx          # collapsible lineage DAG
    ui.tsx                # Card, Spinner, error/empty states, JsonBlock
  pages/
    DatasetsPage.tsx
    DatasetDetailPage.tsx
    IngestPage.tsx
    TransformsPage.tsx
    RecipePage.tsx
    LineagePage.tsx
```
