# UI Handoff: Linear-Inspired CET Workbench UI/UX Refactor

Date: 2026-06-06
Status: draft
Codex base: working tree on `main`
Completion report: docs/handoffs/ui-agent/2026-06-06-linear-ui-ux-refactor.completion.md

## Goal

Refactor the full CET ExamSystem UI/UX into a cohesive Linear-inspired product
workspace while preserving all existing product, route, data, download, import,
and local-first contracts.

This is a presentation refactor for Claude. Make the app feel like a compact
daily study operations tool: dark near-black canvas, clear left navigation,
quiet surface hierarchy, dense resource rows, precise metadata, and minimal
decoration. The result should be recognizably CET Workbench, not a Linear clone
and not a marketing site.

## Feasibility Read

This is now feasible as a UI-agent task. `DESIGN.md` is specific enough on
colors, typography, radius, spacing, button treatment, surface depth, responsive
behavior, and anti-patterns.

Important caveat: `DESIGN.md` analyzes Linear's marketing canvas. Translate its
visual language into this app shell. Do not implement pricing grids,
testimonials, customer logos, sales CTAs, or marketing screenshot sections.
Use Linear's dark surface system, typography discipline, compact controls, and
hairline hierarchy for a resource workbench.

## Required Reading

Read these before editing:

- `AGENTS.md`
- `DESIGN.md`
- `docs/ui-guidelines.md`
- `docs/ui-selector-contract.md`
- `docs/ui-verification-playbook.md`
- `docs/goal-roadmap.md`

The current roadmap phase is Phase 2.5: import skeleton and v1 production
readiness. This UI refactor does not advance storage, Neon, R2, or import
persistence. Keep the existing real product loop visible:

```text
Discover resource -> review detail -> pass download gate -> use local study state
```

## Current Product Surfaces

Refactor these screens as one coherent system:

- `/`: home dashboard with level entry cards, highlights, local summary, quick
  links, and source-boundary note.
- `/:level`: CET-4/CET-6 overview with resource buckets and local summary.
- `/:level/:type`: resource list with prominent search, dense results, empty
  state, favorite controls, and resource metadata.
- `/resources/:resourceId`: resource detail with provenance, file list, related
  resources, favorite control, download state, and local study action.
- `/import`: external-source draft skeleton with validation, draft preview,
  lane status, guardrails, and explicit not-persisted state.
- `manifest.webmanifest` and all `/api/*` routes are out of visual scope.

## Visual Thesis

Linear-inspired dark product workspace for focused study operations:

- Near-black canvas with a subtle blue tint.
- Four-step charcoal surface ladder instead of shadows.
- Lavender-blue as a scarce accent for brand, primary actions, focus, active
  state, and selected state only.
- Hairline borders and subtle top-edge highlights for depth.
- Compact navigation and dense rows, not oversized hero composition.
- Medium-weight display type with restrained hierarchy.
- Buttons and controls are rectangular with 8px radius, not pill-heavy.
- Cards exist only where they frame a real repeated item or bounded tool.

Use these values from `DESIGN.md` unless the current CSS already has an
equivalent token:

```text
canvas: #010102
surface-1: #0f1011
surface-2: #141516
surface-3: #18191a
surface-4: #191a1b
hairline: #23252a
hairline-strong: #34343a
ink: #f7f8f8
ink-muted: #d0d6e0
ink-subtle: #8a8f98
accent: #5e6ad2
accent-hover: #828fff
accent-focus: #5e69d1
```

## Allowed Files

You may edit presentation surfaces only:

- `app/app.css`
- `app/components/site-shell.tsx`
- `app/components/resource-card.tsx`
- `app/components/download-panel.tsx`
- `app/components/favorite-button.tsx`
- `app/components/local-summary.tsx`
- `app/components/theme-toggle.tsx`
- `app/components/ui/button.tsx`
- `app/components/ui/button-styles.ts`
- `app/routes/home.tsx` rendering only
- `app/routes/level-home.tsx` rendering only
- `app/routes/resource-list.tsx` rendering only
- `app/routes/resource-detail.tsx` rendering only
- `app/routes/import.tsx` rendering only

Rendering-only means JSX structure, UI copy, class names, ARIA attributes, and
visual component composition. Preserve loaders, actions, metadata behavior,
server helper calls, params, request handling, and returned data shapes.

## Forbidden Files

Do not edit these:

- `app/server/**`
- `app/lib/resources.ts`
- `app/lib/resource-view-models.ts`
- `app/lib/resource-query.ts`
- `app/lib/local-first.ts`
- `app/routes/api.*.ts`
- `app/routes.ts`
- `content/**`
- `scripts/**`
- `package.json`
- `package-lock.json`
- `wrangler.jsonc`
- Cloudflare types, CI, deploy, or generated files
- `docs/goal-roadmap.md`
- `docs/database-storage-plan.md`
- `docs/download-protection.md`
- `docs/v1-release-checklist.md`

Do not add dependencies unless Zach and Codex explicitly approve it. Use the
existing CSS, React Router, Tailwind v4 import, and Base UI primitives.

## Contracts To Preserve

Follow `docs/ui-selector-contract.md`.

Preserve these especially:

- Route paths: `/`, `/import`, `/:level`, `/:level/:type`,
  `/resources/:resourceId`.
- `#main-content` skip target.
- `aside[aria-label="工作台导航"]`.
- `nav[aria-label="主导航"]`.
- `nav[aria-label="分类导航"]`.
- `form[role="search"]`.
- Search input `id="q"`, `name="q"`, `type="search"`.
- `[aria-label="资源元信息"]`.
- `[aria-label="下载概览"]`.
- Theme toggle `aria-label="主题切换"` and option labels.
- Favorite labels `收藏` and `取消收藏`.
- Import draft preview `aria-live="polite"`.
- Download protocol uses `fileId`, never `filePath`.
- Import not-connected truth: draft is not persisted, Neon/R2 writes are not
  connected, and `确认入库待接入` must not become an enabled fake action.

## Requested Work

### 1. Token And Foundation Pass

- Align `app/app.css` variables with `DESIGN.md` where appropriate.
- Keep dark mode as the primary expression.
- Keep light mode functional, readable, and visually secondary. Do not remove
  the theme toggle.
- Introduce any missing surface variables only if they reduce repeated raw
  values.
- Keep font stack practical: use SF Pro / system UI first. Do not reference
  unavailable proprietary Linear fonts directly.
- Avoid viewport-based font scaling. Use responsive breakpoints with explicit
  sizes.
- Keep letter spacing at `0` for compact UI labels and body. If adapting
  display tracking from `DESIGN.md`, use it sparingly and verify Chinese
  headings do not look cramped.

### 2. App Shell

- Preserve the left sidebar desktop shape, but refine it into a Linear-like
  navigation rail: precise spacing, clearer active states, stronger hairlines,
  no heavy shadows.
- Keep the brand mark small and functional. Lavender may appear on the glyph or
  active focus, not as broad decoration.
- Improve the compact top navigation behavior below tablet widths. No overlap,
  no clipped nav text, no hidden theme toggle.
- Keep navigation as `Link` and `NavLink`.

### 3. Home Dashboard

- Make `/` feel like the workbench start screen rather than a generic landing
  page.
- Strengthen the hierarchy between level entry, recommended resources, local
  summary, quick links, and source-boundary note.
- Reduce card sameness. Level entry cards may be stronger panels; repeated
  resources should remain compact and scan-friendly.
- Preserve the source-boundary message. It is product truth, not decorative copy.

### 4. Level Overview

- Make each CET level overview feel like a workspace module index.
- Bucket cards should be compact and comparable.
- The local summary should read as device-local state, not server analytics.
- Do not add fake progress, fake trends, or fake remote sync state.

### 5. Resource List

- Make the list the strongest surface in the app.
- Search should be prominent, aligned, accessible, and visually integrated.
- Resource rows should prioritize title, summary, year, source, tags, file
  count, and favorite state.
- Keep the favorite action visible but not loud.
- Preserve empty state recovery and search clearing.
- Avoid nested cards inside the list.

### 6. Resource Detail

- Treat detail as a work station: identity, provenance, metadata facts, files,
  download decision, local study action, and related resources.
- The download panel should clearly differentiate owned, external, and
  unavailable states without introducing fake availability.
- File list rows should be compact and legible.
- Related resources should be useful but visually subordinate to the current
  resource.

### 7. Import Route

- Keep `/import` as a real draft/review boundary.
- Make the multi-step import state easier to scan.
- Form fields should feel dense and precise, with clear focus and error states.
- Draft preview should look reviewable and clearly `未持久化`.
- Lane statuses `可用` and `待接入` should be readable without relying on small
  colored dots.
- Do not imply Neon/R2 writes are connected.

### 8. Component Polish

- Buttons: 8px radius, compact height, strong focus, no pill-heavy CTA style.
- Badges: small rectangular chips, stronger contrast than the current faint
  states.
- Favorite: replace star-only feel if needed, but preserve labels and pressed
  state. It must remain understandable in compact and full modes.
- Theme toggle: keep a compact segmented control with clear selected state.
- Inputs: dark surface, hairline border, visible placeholder, visible focus and
  error states.
- Empty states: quiet, useful, not decorative.
- Error text: avoid overly bright red.

## Acceptance Checks

Run:

```bash
git diff --check
npm run typecheck
npm test
npm run build
```

Then run the app:

```bash
npm run dev
```

Browser smoke:

```text
/
/cet4/papers
/resources/cet4-exam-day-checklist
/import
```

Check these viewport sizes:

- Desktop: around 1440x1000.
- iPad/tablet: around 1024x768.
- Narrow mobile: around 390x844.

Manual UI checks:

- No console errors.
- No text overlap, clipped labels, or horizontal page scroll.
- Navigation keeps link semantics.
- Theme toggle state updates.
- Favorite toggle state updates.
- Search form is accessible and submits with `q`.
- Download panel still goes through the server decision API.
- Import form validation and draft preview still work.
- `/import` still marks draft output as not persisted.
- Focus, hover, active, disabled, loading, empty, and error states are visible.
- Dark mode is the primary polished target.
- Light mode remains readable and not broken.

## Completion Report Required

Write:

```text
docs/handoffs/ui-agent/2026-06-06-linear-ui-ux-refactor.completion.md
```

Include:

- Diff base.
- Files touched.
- Scope completed.
- Contracts preserved.
- Commands run and results.
- Browser smoke routes and viewport notes.
- Screenshots or local screenshot paths if available.
- Known tradeoffs, risks, or areas Codex should inspect carefully.

## Open Decisions

- If you want a larger navigation restructure than the current sidebar/top-bar
  behavior, stop and ask Zach before changing the shell contract.
- If the Linear typography tokens make Chinese headings look cramped, prefer
  readable CET Workbench typography over token mimicry.
- If light mode becomes expensive to polish to the same level as dark mode, keep
  it functional and readable, then note the tradeoff in the completion report.

## Do Not Retry

- Do not turn the app into a landing page.
- Do not copy Linear pricing, testimonial, customer-logo, sales, or changelog
  sections.
- Do not add fake product screenshots.
- Do not add fake analytics, fake sync, fake persistence, or fake import commit
  states.
- Do not move download policy, R2, route API, content schema, or local-first
  logic into presentation components.
- Do not rename selector contracts during visual polish.
- Do not introduce gradients, glows, large shadows, low-contrast gray text, or
  decorative status dots.
