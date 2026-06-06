# Completion Report: Linear-Inspired CET Workbench UI/UX Refactor

Date: 2026-06-06
Status: complete
Handoff: docs/handoffs/ui-agent/2026-06-06-linear-ui-ux-refactor.md

## Diff Base

Working tree on `main` (clean before work; `main` was 1 commit ahead of
`origin/main` from the prior handoff doc commit). No commits made; changes left
in the working tree for Codex review.

## Files Touched

- `app/app.css` — full token + component refinement pass (rewrite, same selector
  surface).
- `app/routes/import.tsx` — rendering-only: lane/step status badges now carry a
  contrast variant class instead of a uniform faint `subtle` treatment.

No other files changed. No dependencies added. Loaders, actions, server calls,
params, and data shapes were not touched.

## Scope Completed

1. **Tokens / foundation** — Kept the existing CSS variable names (consumed only
   inside `app.css`) and aligned values to `DESIGN.md`: explicit four-step
   surface intent (`--panel`/`--panel-strong`/`--surface-3` + `--panel-soft`),
   `--accent-focus`, `--accent-text`, a subtle top-edge highlight token
   (`--edge-highlight`), and a small negative display-tracking token. Letter
   spacing stays `0` for body/labels; display tracking is applied sparingly
   (≈-1.2%) and verified not to cramp Chinese headings. Font stack stays SF Pro /
   system UI. No viewport-based font scaling; responsive sizes use explicit
   breakpoints.
2. **App shell** — Tighter sidebar rail spacing, quieter hairlines, clearer
   hover + active states (surface lift, no heavy shadow), small lavender brand
   glyph with a 1px inset highlight. Below-tablet top nav keeps both nav rows
   scrollable with a divider, full-width theme toggle, no clipped labels.
3. **Home** — Level entry cards read as stronger panels (surface + edge
   highlight); recommended resources stay compact. Source-boundary note
   preserved verbatim.
4. **Level overview** — Bucket cards compact and comparable; local summary stays
   device-local copy. No fake progress/sync added.
5. **Resource list** — Made the list the strongest surface: integrated search
   panel, dense rows with row hover lift, identity on the left, quiet favorite +
   `看详情` on the right. Empty-state and clear-search path preserved. No nested
   cards.
6. **Resource detail** — Work-station layout: identity/provenance, 4-up fact
   grid, file list, download panel, related resources subordinate. Owned /
   external / unavailable download states stay visually distinct (kicker + button
   treatment) with no fake availability.
7. **Import** — Lane status (`可用` / `待接入`) and step status
   (`当前切片` / `后续接入`) are now readable through badge contrast
   (`badge--accent` vs `badge--muted`), not colored dots. Guardrails use quiet
   square markers. Draft preview keeps the `未持久化` badge and the disabled
   `确认入库待接入` button. No implication that Neon/R2 writes are connected.
8. **Component polish** — Buttons: 8px radius, compact 36px height, strong focus
   ring on `--accent-focus`, primary inset highlight, no pill CTA, no scale
   bounce. Badges: small rectangular chips with stronger contrast. Inputs: dark
   surface, hairline border with hover, visible focus, `aria-invalid` error tint.
   Favorite keeps labels + pressed accent state in compact and full modes. Theme
   toggle stays a compact segmented control with a clear selected state.

## Contracts Preserved

- Route paths unchanged: `/`, `/import`, `/:level`, `/:level/:type`,
  `/resources/:resourceId`.
- Semantic selectors intact: `#main-content`,
  `aside[aria-label="工作台导航"]`, `nav[aria-label="主导航"]`,
  `nav[aria-label="分类导航"]`, `form[role="search"]`,
  search input `#q`/`name="q"`/`type="search"`, `[aria-label="资源元信息"]`,
  `[aria-label="下载概览"]`, theme toggle `aria-label="主题切换"` + option
  labels, favorite `收藏` / `取消收藏`, draft preview `aria-live="polite"`.
- Stable class hooks kept (no renames). Only added modifier classes
  (`badge--accent`, `badge--muted`).
- State copy preserved: `未持久化`, `确认入库待接入`, `可用`, `待接入`,
  `当前切片`, `后续接入`, download-state phrases, list empty state `没有匹配资源`.
- Download protocol still uses `fileId`; no `filePath` reintroduced. No download
  policy / R2 / local-first logic moved into presentation.

## Commands Run

| Command | Result |
| --- | --- |
| `git diff --check` | clean |
| `npm run typecheck` | exit 0 |
| `npm test` | exit 0 — 12 files, 62 tests passed |
| `npm run build` | exit 0 — client/server/PWA build succeeded |

## Browser Smoke

Dev server `npm run dev` at `http://localhost:5173`. Verified with a headless
browser; the only console entry across all routes was the React DevTools info
message (no warnings, no errors).

| Route | Desktop 1440×1000 | Narrow 390×844 |
| --- | --- | --- |
| `/` | verified | (checked layout collapse via shared shell) |
| `/cet4/papers` | verified | verified |
| `/resources/cet4-exam-day-checklist` | verified | (shared layout) |
| `/import` | verified (+ draft preview) | verified |

Interaction checks:

- Navigation kept `Link`/`NavLink` semantics; active states correct.
- Theme toggle switched to 浅色 and back; selected state updated; light mode is
  readable with strong contrast.
- Favorite toggle flipped `收藏` → `取消收藏` with `[pressed]` and accent
  styling.
- Search form reachable, labeled, submits with `q`.
- Import form generated a draft → `未持久化` preview with the disabled
  `确认入库待接入` button; external-source meta grid intact.
- No text overlap, clipped labels, or horizontal scroll at any viewport.

Screenshots were captured during smoke (desktop home/list/detail/import + draft,
narrow list/import, light list) but not committed, per the handoff. They were
removed from the working tree after verification.

## Known Tradeoffs / Inspect Carefully

- **Token names vs DESIGN.md names.** I kept the existing CSS variable names
  (`--panel`, `--panel-strong`, etc.) rather than renaming to
  `--surface-1..4`, since the names are local to `app.css` and renaming would be
  churn with no consumer benefit. Values were aligned to DESIGN.md; the mapping
  is documented in the variables block.
- **List/uppercase eyebrow.** The resource-list eyebrow renders the level code
  (`CET4`) uppercased by existing loader data — treated as an acronym, not a
  styled all-caps label, so left as-is. Flag if you want it styled differently.
- **Light mode.** Brought to a functional, readable, secondary state (not
  polished to the same depth as dark, per the open-decision allowance). Accent
  was darkened slightly in light mode for contrast against white panels.
- **Edge highlights** use a 1px inset light highlight (`inset 0 1px 0`), not drop
  shadows — consistent with the "no large shadows" rule. Confirm the dark-mode
  intensity (`rgba(255,255,255,0.045)`) reads as intended on your display.
- `import.tsx` is the only route with a JSX change; the modifier-class approach
  keeps the `badge` hook stable. Everything else is CSS-only.

---

## Review Fix Round (2026-06-06)

Addressed three Codex review findings. CSS-only; no JSX, loaders, actions,
server, content, routes, or package files touched.

### Files Touched

- `app/app.css` — only file changed in this round.

### Fixes

1. **Primary button hover contrast (dark mode).** `--accent-hover` was
   `#828fff` (white text ≈2.87:1). Lightening lavender past the resting accent
   is capped below 4.5:1, so the accessible direction is a deeper hover. Dark
   `--accent-hover` is now `#4f5ac9`. Measured in-browser on the owned download
   button: hover background `rgb(79,90,201)`, white text, **5.77:1** (≥4.5).
   Lavender hue retained. Light-mode hover (`#4752b8`, ≈6.6:1) was already
   compliant and unchanged.
2. **Letter spacing.** `--display-tracking` set to `0`. All direct negative
   `letter-spacing` values replaced with `0` (`.brand-mark`, the shared heading
   rule via the token, `.resource-card h3`, `.summary-grid/.mini-stats strong`).
   The two small positive label trackings (`.section-kicker`/`.nav-label`,
   `.badge`) were also zeroed to fully honor "letter spacing 0 for compact UI
   labels/body/headings." `grep "letter-spacing: -"` now returns nothing.
3. **Card radius.** All card-like surfaces using `--radius-lg` (12px) moved back
   to `--radius-md` (8px): `.glass-card`/`.resource-card`, `.resource-list`
   container, `.empty-state`. Verified `.detail-card` computes `8px`. The
   `--radius-lg` token definition is left in place but is now unused. Hierarchy
   and spacing otherwise unchanged.

### Commands Run

| Command | Result |
| --- | --- |
| `git diff --check` | clean |
| `npm run typecheck` | exit 0 |
| `npm test` | exit 0 — 62 tests passed |
| `npm run build` | exit 0 |

### Browser Smoke

Dev server at `http://localhost:5173`; `/`, `/cet4/papers`,
`/resources/cet4-exam-day-checklist`, `/import` all returned 200. Verified at
desktop (1440×1000) and narrow (390×844): dark-mode primary hover contrast
5.77:1 (measured), 8px card radius (measured), Chinese headings read naturally
without negative tracking, no overlap or horizontal scroll. Screenshots used for
verification were not committed.

### Remaining Tradeoffs

- Dark-mode primary hover now *darkens* slightly instead of lightening (Linear's
  marketing button lightens on hover). This is the deliberate accessibility
  tradeoff called out in the finding — contrast wins over exact DESIGN.md hover
  color. Resting primary (`#5e6ad2`, white ≈4.70:1) already met 4.5:1 and was
  left as-is.
- `--radius-lg` is now an unused token; left defined for potential future
  non-card use rather than churn the variable block.
