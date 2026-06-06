# UI Handoff Playbook

Status: durable workflow for delegating presentation work to a UI agent.

Run the setup workflow once. Daily UI tasks should create a per-task handoff
file under `docs/handoffs/ui-agent/` rather than changing this playbook.

## Ownership

- Codex owns product logic, architecture, server/content helpers, route
  loader/action contracts, API shape, local-first storage, download policy,
  Cloudflare/R2 behavior, scripts, tests, and verification review.
- Zach directs the UI agent and decides visual taste, scope, and whether a UI
  task is ready to hand off.
- The UI agent owns presentation implementation inside the task handoff:
  component markup, CSS, typography, spacing, responsive layout, interaction
  polish, accessibility polish, and UI-only copy.

## Allowed UI-Agent Scope

A handoff may allow edits to:

- `app/app.css`.
- Presentation components under `app/components/`.
- Thin UI wrappers under `app/components/ui/` when the task is about visual
  variants or accessibility defaults.
- React rendering, UI copy, class names, and accessibility attributes inside
  route modules under `app/routes/*.tsx`.
- Documentation files that the handoff explicitly asks the UI agent to update.

When editing route modules, preserve loader/action exports, metadata behavior,
server helper calls, route params, and returned data shapes unless Codex has
already changed those contracts.

## Forbidden UI-Agent Scope

The UI agent must not edit these without a Codex-owned handoff that explicitly
changes the contract:

- `app/server/**`.
- `app/lib/resources.ts`, `app/lib/resource-view-models.ts`,
  `app/lib/resource-query.ts`, and `app/lib/local-first.ts`.
- API route modules such as `app/routes/api.*.ts`.
- `app/routes.ts` route ordering.
- `content/**`, including generated indexes.
- `scripts/**`, `wrangler.jsonc`, Cloudflare types, package manager files,
  dependency lists, CI files, or deploy configuration.
- Roadmap, product scope, storage architecture, import persistence, download
  protocol, auth/sync behavior, or fake connected states.

## Automatic Handoff Trigger

When Codex changes, designs, or reviews non-UI logic and detects a concrete UI
follow-up, Codex creates a handoff at:

```text
docs/handoffs/ui-agent/YYYY-MM-DD-<slug>.md
```

Codex may skip only when:

- There is no UI consequence.
- An existing unsent handoff already covers the same follow-up.
- Zach explicitly asks Codex to implement UI in the current turn.

Old handoffs are task snapshots. Durable lessons should be promoted into
`AGENTS.md`, this playbook, `docs/ui-guidelines.md`,
`docs/ui-selector-contract.md`, or `docs/ui-verification-playbook.md`.

## Handoff Template

```markdown
# UI Handoff: <task title>

Date: YYYY-MM-DD
Status: draft
Codex base: <branch or commit if known>
Completion report: docs/handoffs/ui-agent/YYYY-MM-DD-<slug>.completion.md

## Goal

<What presentation outcome Zach wants.>

## Current Context

- Roadmap phase:
- Routes/screens:
- Existing behavior:
- Why this is UI-only:

## Allowed Files

- app/app.css
- app/components/...
- app/routes/... rendering only

## Forbidden Files

- app/server/**
- app/lib/... contract files
- app/routes/api.*.ts
- app/routes.ts
- content/**
- scripts/**
- package/deploy/config files

## Contracts To Preserve

- See docs/ui-selector-contract.md.
- <Task-specific selector, copy, request, or route contracts.>

## Requested Work

- <Specific visual/layout/copy/accessibility tasks.>

## Acceptance Checks

- <Screens and states to verify.>
- `git diff --check`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser smoke from docs/ui-verification-playbook.md

## Open Decisions

- <Questions Zach should answer before or during UI work.>

## Do Not Retry

- <Rejected approaches, failed commands, or visual directions to avoid.>
```

## Completion Report Template

For medium or larger UI tasks, the UI agent writes a sibling report:

```text
docs/handoffs/ui-agent/YYYY-MM-DD-<slug>.completion.md
```

```markdown
# UI Completion: <task title>

Date: YYYY-MM-DD
Handoff: docs/handoffs/ui-agent/YYYY-MM-DD-<slug>.md
Diff base: <branch, commit, or "working tree">

## Files Touched

- <path>

## Scope Completed

- <What changed.>

## Contracts Preserved

- <Selectors, route paths, copy, and request protocols kept stable.>

## Verification

- `git diff --check`: <result>
- `npm run typecheck`: <result or skipped reason>
- `npm test`: <result or skipped reason>
- `npm run build`: <result or skipped reason>
- Browser smoke: <routes, viewports, and result>

## Known Tradeoffs Or Risks

- <Anything Codex should review carefully.>
```

## Codex Review Checklist

- Read the handoff and completion report.
- Check `git status --short --branch -uall` and identify unrelated work.
- Review the actual diff, not only the report.
- Confirm forbidden files and non-UI contracts were not changed.
- Confirm selector and state-copy changes match
  `docs/ui-selector-contract.md`.
- Run or inspect the command gates that match the touched surface.
- Report findings first if reviewing; keep summaries short.
