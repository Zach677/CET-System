# Goal Roadmap

Date: 2026-06-01
Status: Active execution map for `/goal`-style work

## Goal

Ship a compact CET-4/CET-6 study workbench that supports legal resource
discovery, detail review, controlled downloads, favorites, and browser-local
study state.

The product should stay a resource-focused study surface, not a public
exam-paper mirror. It should keep legal provenance, cost controls, and future
Neon migration boundaries visible in every meaningful slice.

## Current Phase

Phase 2.5 - Import skeleton and v1 production readiness.

This phase exists to finish the first real workbench loop before starting the
database migration:

```text
Discover resource -> review detail -> pass download gate -> use local study state
```

The import surface is present as a draft/review boundary, but it intentionally
does not persist to Neon or upload files to R2 yet.

## Done Means

The current phase is done when:

- `/import` can create reviewed external-source drafts without persistence.
- At least one owned resource is backed by a real R2 object in the target
  Cloudflare account.
- A production smoke confirms the Worker download gate can serve that object.
- Resource metadata includes enough real provenance to support a small private
  study workflow.
- `npm run typecheck`, `npm test`, `npm run build`, and `npm run check` pass.
- UI smoke passes for `/`, `/cet4/papers`, `/resources/cet4-exam-day-checklist`,
  and `/import` at desktop and narrow widths.

## Phase Map

### Phase 1 - Domain And Service Boundary

Status: done.

Outcome:

- `ResourceRepository` gives route loaders a storage-neutral resource boundary.
- `ResourceService` maps raw records into list/detail/home view models.
- `DownloadService` owns download decisions and denial reason codes.
- API error responses are normalized.
- Focused service tests cover repository, resource, download, and API behavior.

### Phase 2 - Workbench Information Architecture

Status: mostly done.

Outcome:

- Home, level overview, resource list, and resource detail routes are
  workbench-shaped rather than landing-page-shaped.
- Search and filtering are prominent on list pages.
- Download actions stay on detail pages.
- Favorites, local summary, theme state, and local-first storage are in place.

Remaining:

- Continue polishing dense study workflows as real content grows.
- Keep resource list/detail UI aligned with provenance and controlled-download
  boundaries.

### Phase 2.5 - Import Skeleton And V1 Readiness

Status: active.

Outcome:

- `/import` is a real route with loader/action boundaries.
- External legal-source drafts can be generated and reviewed without
  persistence.
- The UI clearly marks Neon/R2 write paths as not connected.
- The first production R2-backed download smoke has passed.
- The first real resource batch now uses official external sources plus one
  self-authored owned study card with matching provenance and file evidence.
- The remaining release gate is refreshing that owned object in R2 after the new
  metadata is deployed.

Active checklist:

- [x] Add `/import` route.
- [x] Add external-source draft service and tests.
- [x] Add import entry to primary navigation.
- [x] Add repeatable R2/download smoke tooling.
- [x] Confirm one controlled file is available from R2.
- [x] Map that file to a stable `file.id` value in authored content.
- [x] Smoke production `/api/resources/:id/download`.
- [x] Smoke production `/api/resources/:id/file?fileId=...`.
- [x] Support explicit Cloudflare account id for local R2 smoke uploads.
- [x] Confirm local OAuth R2 upload/get/delete smoke with a temporary object.
- [x] Smoke UI routes at desktop and narrow widths.
- [ ] Refresh the mapped controlled object only when the source file and
      resource metadata/provenance match.
- [x] Add the first real resource batch with source/provenance notes.
- [x] Record v1 release checklist and known limitations.

### Phase 3 - Storage And Cost-Control Boundary

Status: mostly done.

Outcome:

- R2 binding and Worker file gateway are configured.
- Download decisions happen before R2 reads.
- Cloudflare Rate Limiting binding protects anonymous download traffic.
- Budget mode can keep the file gateway open, decision-only, or closed.
- Wrangler dry-run validates production bindings.
- A real-environment smoke with an actual R2 object has passed.

Remaining:

- Keep high-volume telemetry deferred until cost or abuse data proves the need.

### Phase 4 - DB And Import Migration

Status: deferred.

Outcome:

- Add Neon Postgres metadata schema behind the existing repository boundary.
- Add raw SQL migrations and a small migration runner.
- Treat current JSON content as seed/import fixture data.
- Add a DB-backed resource repository with conformance tests shared with the
  JSON provider.
- Add a reviewable import pipeline that writes metadata to Neon and owned files
  to R2.

Do not start this phase until the JSON content workflow becomes the bottleneck
or the import pipeline needs persistent review state.

## Current Non-Goals

- User accounts or cross-device sync.
- Full file upload and commit pipeline.
- Production Neon migration.
- Vector search or semantic retrieval.
- Server-side study history.
- Public mirror behavior for restricted resources.
- Download decision logging beyond coarse future needs.

## Goal Operating Rules

- Before non-trivial work, identify which phase and checklist item the work
  advances.
- Prefer the smallest real slice that exercises the final architecture boundary.
- Do not add fake demo paths that bypass route loaders, resource services,
  download services, or local-first storage.
- Update the active checklist when a meaningful slice lands.
- Move deferred or out-of-scope work into the active phase only after an explicit
  product reason is recorded.
