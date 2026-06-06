# UI Guidelines

Status: durable guidance for CET ExamSystem presentation work.

Use this document with `AGENTS.md`, `docs/ui-selector-contract.md`, and
`docs/ui-verification-playbook.md` before broad UI changes. Per-task visual
requests belong in `docs/handoffs/ui-agent/`.

## Product Frame

CET ExamSystem is an iPad-first study workbench for resource discovery, detail
review, controlled downloads, favorites, import review, and browser-local study
state. It is not a public exam-paper mirror or a marketing landing page.

The current roadmap phase is Phase 2.5: import skeleton and v1 production
readiness. UI work should keep the real loop visible:

```text
Discover resource -> review detail -> pass download gate -> use local study state
```

The `/import` route is a draft/review boundary. It must continue to signal that
Neon and R2 writes are not connected until Codex changes the underlying storage
contracts.

## Information Architecture

- Home is a study dashboard and continuation surface.
- Level overview pages summarize the CET-4/CET-6 resource buckets.
- Resource lists are dense scanning surfaces with prominent search and filters.
- Resource detail pages are action stations for provenance, files, download
  decisions, and local study actions.
- Import is the differentiator: it turns legal external sources into reviewable
  metadata drafts before persistence exists.

Keep downloading on detail pages. Keep search and filtering on list pages. Keep
local study state as client-owned UI state backed by `app/lib/local-first.ts`.

## Visual Direction

- Calm, compact, resource-focused, and easy to scan.
- Strong contrast on white or light surfaces; avoid faint gray text.
- Headings should not be overly heavy, and small text should remain readable.
- Avoid all-caps labels, excessive cards, nested cards, heavy shadows,
  decorative gradients, bright red, and status dots used as decoration.
- Prefer normal document flow over absolute-positioned action panels. Sidebars,
  tables of contents, and action areas must not overlap content at smaller
  widths.
- Use cards only for repeated resource items, focused panels, or bounded tools.
  Page sections should stay full-width or unframed where possible.
- Amounts, counters, and major titles may use a more distinctive common UI font,
  but keep body text in the existing system UI stack unless a task handoff
  explicitly revises typography.

## Component Rules

- Base UI is a headless accessibility layer. Styling belongs in `app/app.css`
  and small project wrappers under `app/components/ui/`.
- Use `Link` and `NavLink` for navigation. Use buttons only for actions.
- Share visual classes through `buttonClassName()` when anchors need button-like
  styling.
- Keep reusable primitives thin. A wrapper may add project variants and semantic
  defaults, but it should not hide the Base UI contract.
- Preserve route loader/action boundaries when editing route modules. UI work in
  `app/routes/*.tsx` may change rendered markup and UI copy only when it leaves
  loader/action exports and server calls intact.

## Screen Notes

### Home

- Show study continuation, local summary, and resource entry points.
- Avoid oversized hero copy or decorative marketing composition.

### Resource List

- Keep the search form near the top.
- Put resource identity, provenance, year, and summary on the left.
- Keep per-resource state or supplemental actions on the right when space
  allows.
- Empty states should help the user recover without suggesting fake content.

### Resource Detail

- Keep provenance, access state, file list, and download action visible without
  crowding.
- The action panel must explain external, unavailable, and owned-download states
  without implying a file exists when the policy says it does not.
- Local study actions may call local-first storage, but must not know bucket
  details or construct privileged URLs.

### Import

- Keep draft generation clearly separated from persistence.
- Keep planned Neon/R2 write paths visibly unavailable until Codex changes the
  real service/storage boundary.
- Validation, draft preview, lane status, and guardrails should stay readable at
  desktop and narrow widths.

## Visual Reference

`DESIGN.md` is the primary current visual reference. It captures the
Linear-inspired dark canvas, surface ladder, hairline borders, lavender accent,
compact buttons, typography, radius, spacing, and responsive tokens.

Use `DESIGN.md` as a reference for visual language, not as permission to turn
the app into a Linear marketing page. Pricing, testimonial, customer-logo,
sales, and marketing screenshot patterns are not CET Workbench product
requirements unless a task handoff explicitly adapts them.

The approved architecture and information-architecture direction in
`docs/superpowers/specs/2026-05-22-cet-workbench-refactor-design.md` remains the
long-form product reference. Use it for broad workbench structure, data
boundaries, route behavior, and future migration context.
