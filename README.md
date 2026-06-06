# CET ExamSystem

CET ExamSystem is a compact CET-4/CET-6 preparation workbench for resource
discovery, detail review, controlled downloads, favorites, and local study
state. It is not a public exam-paper mirror. The product direction is a
resource-focused study surface with legal provenance, cheap serverless
operations, and a migration path from authored JSON content to Neon Postgres.

## Stack

- React 19 and React Router 7 Framework Mode
- Vite, Tailwind CSS v4, and Base UI headless primitives
- Vitest, Testing Library, and TypeScript project references
- Cloudflare Workers, Wrangler, R2, Rate Limiting bindings, and PWA output
- Browser IndexedDB for local-first favorites, study records, and cache marks

`npm` is the canonical package workflow for this repository. Keep
`package-lock.json` in sync because Docker and CI-style installs rely on it.

## Quick Start

```bash
npm install
npm run dev
```

The development server normally opens at `http://localhost:5173`. Both
`npm run dev` and `npm run build` rebuild the generated content index first.

Useful routes for smoke testing:

- `/`
- `/cet4/papers`
- `/resources/cet4-exam-day-checklist`
- `/import`

## Current Goal

The active execution map lives in `docs/goal-roadmap.md`. Read it before
planning non-trivial work so changes stay aligned with the current phase,
checklist, and explicit non-goals.

Current phase: Phase 2.5 - import skeleton and v1 production readiness. The
production download gate and R2 smoke path are verified. The first real resource
batch now uses official external sources plus one self-authored owned study
card. The remaining product slice is to deploy that metadata, refresh the mapped
R2 object, and smoke it against the production Worker.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build content and start the React Router dev server. |
| `npm run content:build` | Generate search/content indexes from authored JSON. |
| `npm run typecheck` | Generate Cloudflare and React Router types, then run TypeScript. |
| `npm test` | Run the Vitest suite once. |
| `npm run build` | Build the production React Router app. |
| `npm run check` | Build and run `wrangler deploy --dry-run`. |
| `npm run cloudflare:login` | Start Wrangler login. |
| `npm run cloudflare:bootstrap` | Ensure Wrangler-managed resources and validate the Worker bundle. |
| `npm run smoke:download` | Upload or verify one R2-backed owned file through the Worker download gate. |
| `npm run deploy` | Build and deploy with Wrangler. |

## Project Shape

```text
app/
  components/        Shared UI and local client components
  components/ui/     Thin Base UI wrappers and shared visual classes
  lib/               Client-safe helpers, local-first storage, view models
  routes/            React Router route modules and resource API routes
  server/            Content repository, resource service, download policy
content/
  cet4/              Authored CET-4 resource metadata
  cet6/              Authored CET-6 resource metadata
  generated/         Generated search/content indexes
docs/                Production architecture and deployment notes
scripts/             Content and Cloudflare setup scripts
workers/             Cloudflare Worker entry
```

Route modules should stay thin: validate params, call `app/server` helpers, and
render typed route state. Presentation components should not know R2 bucket
details or construct privileged file URLs directly.

## Content Workflow

Authored metadata lives in:

- `content/cet4/resources.json`
- `content/cet6/resources.json`

After editing content, run:

```bash
npm run content:build
```

Generated files under `content/generated/` are consumed by server/content
helpers. Keep route loaders and UI code behind the existing repository/service
boundary so the future Neon provider can replace JSON without a route rewrite.

## Download Protection

Owned files are served through Worker download gates before any R2 read happens.
The current production boundary is:

```text
Browser -> React Router Worker -> DownloadService -> Rate Limiting -> R2
```

`wrangler.jsonc` declares:

- `RESOURCE_BUCKET` for owned resource files.
- `DOWNLOAD_RATE_LIMITER` for anonymous download gate protection.
- `DOWNLOAD_BUDGET_MODE` for cost-control kill switches.
- `R2_PUBLIC_BASE_URL` for optional public object delivery.

First-time Cloudflare setup:

```bash
npm run cloudflare:bootstrap -- --dry-run
npm run cloudflare:login
npm run cloudflare:bootstrap
```

In non-interactive environments, set `CLOUDFLARE_API_TOKEN` instead of using
browser login. See `docs/download-protection.md` for token scope, dry-run
behavior, and production smoke checks.

For the first real owned file smoke, use `docs/v1-release-checklist.md` and
`npm run smoke:download`. Local R2 upload smoke can take
`--account-id <cloudflare-account-id>`, or inherit `CLOUDFLARE_ACCOUNT_ID` from
the shell, so Wrangler does not need `/memberships` account discovery.

## Database Direction

The app currently reads resource metadata from JSON. When the dataset outgrows
file-authored content, the target production path is:

```text
React Router Worker -> Hyperdrive binding -> Neon Postgres
```

Large files should remain in R2 or another S3-compatible object store. Postgres
stores metadata, object keys, hashes, source facts, import status, and policy
state; it should not store PDF, audio, ZIP, image, or extracted raw file bytes.

See `docs/database-storage-plan.md` for the schema draft and migration boundary.

## Design Direction

The UI direction is an iPad-first study workbench with a Linear-inspired app
shell: calm dark surfaces, compact navigation, strong contrast, minimal
decoration, and resource rows that stay easy to scan. Base UI is used for
accessible behavior, not visual theming.

Use `DESIGN.md`, `docs/ui-guidelines.md`, `docs/ui-selector-contract.md`, and
`AGENTS.md` before broad UI changes. Per-task UI-agent work should start from
`docs/ui-handoff-playbook.md`. Avoid nested cards, heavy shadows, overly faint
gray text, all-caps labels, and page designs that feel like marketing landing
pages instead of a working study tool.

## Verification

Run these after meaningful code changes:

```bash
npm run typecheck
npm test
npm run build
```

For Cloudflare or download-gate changes, also run:

```bash
npm run check
```

For UI changes, start the app and smoke at least `/`, `/cet4/papers`, and
`/resources/cet4-exam-day-checklist`. Check that navigation keeps link semantics,
theme and favorite toggles work, search remains accessible, and no text overlaps
at desktop or narrow widths.

## Deployment

Do not run production deploys until Cloudflare authentication, R2 bucket
bindings, rate limiting, and real owned files are configured for the target
account.

```bash
npm run deploy
```

The Worker is the production application runtime and download policy boundary.
Keep secrets in Wrangler secrets or CI secrets, never in `wrangler.jsonc`,
source files, docs, commits, or logs.

### GitHub Actions Deployment

After the first manual Cloudflare bootstrap, production deploys are handled by
`.github/workflows/deploy.yml`.

The workflow runs on pull requests, pushes to `main`, and manual dispatches. Pull
requests run the verification gates only. Pushes to `main` run typecheck, tests,
build, a Wrangler dry-run, and then deploy the Worker.

Required GitHub Actions secrets:

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID --body "<account-id>"
gh secret set CLOUDFLARE_API_TOKEN --body "<api-token>"
```

Use a Cloudflare API token scoped to the target account and Worker deployment.
Do not store the token in repository files or local docs.
