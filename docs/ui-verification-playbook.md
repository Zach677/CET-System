# UI Verification Playbook

Status: required checks for medium or larger UI-agent work.

Use the cheapest check that proves the touched surface. Do not claim a UI task
is verified from TypeScript alone.

## Setup

```bash
npm install
npm run dev
```

The dev server normally runs at `http://localhost:5173`. `npm run dev` rebuilds
the generated content index through `predev`.

## Required Browser Smoke

Smoke these routes for broad UI work:

```text
/
/cet4/papers
/resources/cet4-exam-day-checklist
/import
```

Check at least these viewport shapes:

- Desktop: around `1440x1000`.
- iPad/tablet: around `1024x768`.
- Narrow mobile: around `390x844`.

For every viewport, check:

- No console errors.
- No text overlap, clipped control labels, or horizontal page scroll.
- Navigation uses links and keeps route state intact.
- Search form is reachable, labeled, and submits with `q`.
- Theme toggle changes visible state.
- Favorite toggle changes visible state and remains keyboard reachable.
- Download panel shows the correct owned, external, or unavailable state.
- `/import` clearly marks draft output as not persisted and Neon/R2 writes as
  not connected.
- Hover, focus, disabled, loading, empty, and error states remain readable.

## Command Gates

Run after meaningful UI changes:

```bash
git diff --check
npm run typecheck
npm test
npm run build
```

Use narrower gates only for very small copy or docs-only changes, and state what
was skipped in the completion report.

Run the full production-style check when UI work touches Cloudflare bindings,
download routing, content generation, or build output behavior:

```bash
npm run check
```

## Screenshot Evidence

For medium or larger UI tasks, capture or describe screenshots for:

- Desktop `/`.
- Desktop `/cet4/papers`.
- Desktop `/resources/cet4-exam-day-checklist`.
- Desktop `/import`.
- Narrow `/cet4/papers`.
- Narrow `/import`.

Do not commit screenshots unless the handoff explicitly asks for committed
artifacts. The completion report may reference local screenshot paths or describe
manual observations.

## Review Notes

Codex review should verify the actual diff against:

- `AGENTS.md` ownership rules.
- `docs/ui-guidelines.md` visual constraints.
- `docs/ui-selector-contract.md` selector and protocol stability.
- The handoff acceptance checks.
- The command output and browser smoke evidence in the completion report.
