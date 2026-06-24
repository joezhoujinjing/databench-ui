# Releasing databench-ui

Releases are driven by the `version` field in `package.json`. Bumping it on
`main` auto-creates a tag, which builds the SPA and publishes it to the live
site **https://databench.jinjing.me** (Aliyun OSS static website + CDN).

> Releases publish whatever is on `main`. Merge your feature code to `main`
> first — the release builds `main` at the tagged commit, not any feature branch.

## Cut a release

1. Branch off `main`: `git checkout -b release/<version> origin/main`.
2. Bump `"version"` in `package.json` (e.g. `0.1.0` → `0.2.0`).
3. Prepend a new section to `CHANGELOG.md` directly under the `# Changelog`
   header: `## [<version>] - <YYYY-MM-DD>` with high-level `Added` / `Changed` /
   `Fixed` bullets. This section becomes the GitHub Release body.
4. Open a PR to `main` and merge it.

That's it. On merge:

- **`auto-tag-release.yml`** sees `package.json` changed on `main`, compares the
  version against the previous commit, and (if it bumped) pushes tag
  `v<version>`. The checkout uses `RELEASE_TOKEN` so the tag push can trigger the
  next workflow.
- **`release.yml`** runs on the `v*` tag: `npm ci` → `npm run build`, then
  `aliyun oss sync dist/ oss://databench-ui/ --delete` to mirror the build,
  sets `Cache-Control: no-cache` on `index.html`, refreshes the CDN for
  `databench.jinjing.me`, and creates a GitHub Release whose notes are the
  latest `CHANGELOG.md` section (falling back to auto-generated notes).

## Do NOT push tags manually

Let the version bump on `main` create the tag. A manually pushed tag bypasses
the bump/changelog discipline, and a tag pushed with the default `GITHUB_TOKEN`
won't trigger `release.yml` anyway. To re-run a publish for an existing version,
use the **Run workflow** (`workflow_dispatch`) button on `release.yml`.

## Required GitHub secrets

| Secret | Purpose |
| --- | --- |
| `RELEASE_TOKEN` | PAT (repo scope) used by `auto-tag-release.yml` to push the tag so it triggers `release.yml`. The default `GITHUB_TOKEN` cannot trigger downstream workflows. |
| `OSS_ACCESS_KEY_ID` | Aliyun AccessKey ID for the OSS upload + CDN refresh. |
| `OSS_ACCESS_KEY_SECRET` | Aliyun AccessKey secret (pair with the ID above). |

## Deploy target reference

- Bucket: `oss://databench-ui` — endpoint `oss-cn-hongkong.aliyuncs.com`.
- CDN custom domain: `databench.jinjing.me` (refreshed after each upload).
- Bucket website config: IndexDocument `index.html`, ErrorDocument `index.html`
  returning HTTP 200 — the SPA fallback. Keep this.
- Caching: `index.html` is `no-cache`; hashed assets under `assets/` are
  immutable and long-cached.
