# AGENTS.md - CET ExamSystem project conventions

This file is the project-level rulebook for AI coding assistants working on
`CET-ExamSystem`. It composes with Zach's global agent rules. If instructions
conflict, follow this order: direct user instruction > this file > tool defaults.

## One-minute Primer

- Product: a compact CET-4/CET-6 preparation workbench for resource discovery,
  detail review, controlled downloads, favorites, and local study state.
- Stack: React 19, React Router 7 Framework Mode, Vite, Tailwind CSS v4,
  Base UI, Vitest, Cloudflare Workers, R2, and PWA output.
- Package manager: npm is the canonical workflow for this repo. `package-lock.json`
  is used by Docker and CI-style installs; do not switch routine commands to pnpm
  just because `pnpm-lock.yaml` exists.
- Content source: authored resources live under `content/`; generated indexes are
  produced by `npm run content:build`.

## Working Mode

- Before non-trivial work, read `docs/goal-roadmap.md` and identify the current
  phase, active checklist item, and explicit non-goals. If the requested work
  does not map to the active phase, mention the mismatch before changing code.
- Read the existing route/component shape before changing UI. This app is small,
  so prefer focused changes over introducing a large design-system layer.
- For non-trivial work, identify the smallest real slice that exercises the final
  architecture. Do not ship a fake demo path that bypasses route loaders,
  resource APIs, or local-first storage.
- Keep route modules thin: loaders validate params, call server/content helpers,
  and return typed data; components render the route state.
- Keep reusable UI primitives under `app/components/ui/` only when they wrap a
  repeated behavior or preserve a semantic distinction.

## React Router Rules

- This repo uses React Router Framework Mode with explicit routes in
  `app/routes.ts`.
- Order matters in `app/routes.ts`: static/resource routes must appear before
  broad dynamic routes such as `:level`.
- Use route modules for metadata, loaders, error boundaries, and page rendering.
- Preserve link semantics. Use `Link`/`NavLink` for navigation and use buttons
  only for actions.
- For static PWA/resource endpoints such as `manifest.webmanifest`, prefer an
  explicit resource route when the URL could otherwise be swallowed by a dynamic
  route.
- If React Router APIs have changed or feel uncertain, check the current official
  docs before coding.

## Base UI Rules

- Base UI is used as a headless accessibility primitive layer, not as a visual
  theme. Styling remains owned by `app/app.css` and local class helpers.
- Prefer Base UI for interactive primitives: `Button`, `Toggle`, `ToggleGroup`,
  `Field`, `Input`, `Dialog`, `Popover`, `Select`, `Tabs`, `Tooltip`, and similar
  controls.
- Do not wrap router links in Base UI buttons. Share visual classes through
  `buttonClassName()` while keeping anchors as anchors.
- When adding a Base UI import, verify both SSR build and browser hydration. If
  hook-dispatcher or duplicate React issues appear, keep `resolve.dedupe` for
  `react` and `react-dom` intact.
- Keep wrappers thin. A local UI component should add project naming, variants,
  and semantic defaults, not hide the underlying Base UI contract.

## UI Direction

- Optimize for an iPad-first study tool, not a marketing landing page.
- Keep layouts calm, scannable, and resource-focused. Avoid excessive cards,
  nested cards, heavy shadows, decorative gradients, and low-contrast gray text.
- Use cards only for repeated resource items, focused panels, or bounded tools.
  Prefer full-width sections and clear list structure for dense resource views.
- Search and filtering should be prominent on list pages; downloading stays on
  detail pages.
- Put the primary distinguishing content on the left and supplemental actions on
  the right for resource lists/cards. Favorite toggles are acceptable repeated
  supplemental actions because they carry per-resource state.
- Avoid absolute-positioned action panels unless there is a verified responsive
  layout reason. If a sidebar, TOC, or action area can overlap content at smaller
  widths, use normal document flow first.
- Follow the global UI preferences: headings should not be overly heavy, small
  text must remain readable, avoid all-caps labels, avoid overly bright red, and
  keep white-background contrast strong.

## UI Delegation Workflow

- Codex owns product logic, route loader/action contracts, server helpers,
  content schemas, download policy, local-first storage, API shape, Cloudflare
  bindings, scripts, verification, and review of non-UI boundaries.
- Zach directs the UI agent for presentation implementation. The UI agent owns
  visual layout, typography, spacing, responsive behavior, interaction polish,
  and UI-only copy within an explicit handoff.
- When Codex changes, designs, or reviews non-UI logic and finds a concrete UI
  follow-up, Codex must create a handoff in
  `docs/handoffs/ui-agent/YYYY-MM-DD-<slug>.md` instead of editing
  presentation code. Zach does not need to ask for that handoff separately.
- Codex may skip the handoff only when there is no UI consequence, an existing
  unsent handoff already covers the same follow-up, or Zach explicitly asks
  Codex to implement UI in the current turn.
- If non-trivial logic work has no UI follow-up, mention that briefly in the
  final response.
- UI handoffs and completion reports follow `docs/ui-handoff-playbook.md`.
  Selector and copy changes must follow `docs/ui-selector-contract.md`, and
  visual work must follow `docs/ui-guidelines.md` plus
  `docs/ui-verification-playbook.md`.
- Treat a UI completion report as a claim, not proof. Codex reviews the actual
  diff, preserved contracts, non-UI boundaries, and command output before
  accepting the work.

## Local-first and API Boundaries

- `app/lib/local-first.ts` owns browser-local study state. Do not move this state
  into route loaders or server modules.
- Server/content helpers under `app/server/` own resource lookup and download
  decisions. Keep R2/download policy logic out of presentation components.
- Client components may call local-first storage and route APIs, but they should
  not know R2 bucket details or construct privileged URLs directly.
- Restricted or externally hosted resources must stay as source explanations and
  external links, not fake local downloads.

## File and Language Conventions

- Identifiers, code comments, commit messages, and technical docs are English.
- User-facing application copy may be Chinese when it matches the current UI.
- When editing an existing file, follow that file's language and style.
- Keep comments rare and use them only to explain non-obvious intent.
- Do not introduce new top-level folders unless the app has outgrown the current
  small route/component/server split.

## Verification Gates

Run these after meaningful changes:

```bash
npm run typecheck
npm test
npm run build
```

For UI changes, also run the dev server and smoke at least:

```bash
npm run dev
# Browser smoke:
# /
# /cet4/papers
# /resources/cet4-paper-2024-12-a
```

During browser smoke, check for:

- no console errors,
- route navigation keeps link semantics,
- theme toggle state updates,
- favorite toggle state updates,
- search form remains accessible and submits correctly,
- no text overlap at desktop and narrow widths.

## Git Rules

- Do not commit, push, amend, rebase, reset, or force-push unless Zach explicitly
  asks.
- Keep commits focused. Do not sweep generated build output, local caches, or
  unrelated working tree changes into a commit.
- Conventional commit messages are preferred.

## Lessons from Comparable React Router Migrations

- Route migrations should document route conventions, server-only boundaries,
  and verification commands alongside code changes.
- UI redesigns should turn style intent into reusable tokens/classes instead of
  scattering raw visual literals.
- Layout fixes should prefer normal flow and slots over absolute positioning when
  action controls and sidebars can collide.
