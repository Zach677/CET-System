# UI Selector Contract

Status: stable contract for UI handoffs, browser smoke, and Codex review.

This repo currently relies on semantic selectors, route paths, class hooks, and
user-visible state copy rather than `data-testid` attributes. UI agents may add
task-specific test IDs only when the handoff asks for them or when a test/smoke
needs a more stable hook.

## Change Protocol

- Do not rename or remove a stable selector, route path, request field, ARIA
  label, or state copy during visual polish unless the handoff explicitly asks
  for that contract change.
- If a selector contract must change, update this document, the affected tests
  or smoke instructions, and the handoff completion report in the same diff.
- Prefer adding a stable semantic hook over making browser smoke depend on
  brittle text position or deep CSS ancestry.
- Keep visual class refactors separate from contract changes when possible.

## Route Contracts

| Surface | Contract |
| --- | --- |
| Home | `/` |
| Import | `/import` |
| Level overview | `/:level`, currently `/cet4` and `/cet6` |
| Resource list | `/:level/:type`, for example `/cet4/papers` |
| Resource detail | `/resources/:resourceId` |
| Manifest | `/manifest.webmanifest` |
| Resource APIs | `/api/resources`, `/api/resources/:resourceId`, `/api/search` |
| Download decision | `POST /api/resources/:resourceId/download` with JSON `{ "fileId": "<id>" }` |
| File gateway | `GET /api/resources/:resourceId/file?fileId=<id>` |

Static, manifest, API, and resource routes must stay ordered before broad
dynamic routes in `app/routes.ts`.

## Semantic DOM Contracts

| Surface | Selector or label | Purpose |
| --- | --- | --- |
| Skip link target | `#main-content` | Keyboard skip destination for the main page body. |
| App navigation | `aside[aria-label="工作台导航"]` | Primary shell navigation landmark. |
| Primary nav | `nav[aria-label="主导航"]` | Main route navigation. |
| Section nav | `nav[aria-label="分类导航"]` | Level-specific category navigation. |
| Resource search | `form[role="search"]` | Resource list search landmark. |
| Search input | `#q`, `name="q"`, `type="search"` | Query field used by resource list loaders. |
| Resource facts | `[aria-label="资源元信息"]` | Detail metadata grid. |
| Download summary | `[aria-label="下载概览"]` | Owned download count summary. |
| Theme toggle group | `aria-label="主题切换"` | Theme mode control. |
| Theme option buttons | `aria-label="切换到...主题"` | Individual theme choices. |
| Favorite action | `aria-label="收藏"` and `aria-label="取消收藏"` | Local favorite toggle state. |
| Import draft preview | `aria-live="polite"` | Announces generated draft preview. |

## Stable Class Hooks

The following classes are allowed to carry visual styling, layout, and smoke
selection. Avoid renaming them during unrelated polish:

- Shell: `page-shell`, `app-shell`, `site-sidebar`, `page-main`,
  `page-heading`, `brand-nav`, `section-tabs`, `sidebar-footer`.
- Cards and panels: `glass-card`, `resource-card`, `resource-card--list`,
  `action-panel`, `download-panel`, `search-panel`, `detail-card`,
  `import-form`, `import-steps`, `draft-preview`, `lane-panel`.
- Layout utilities: `stack`, `content-layout`, `sidebar-stack`,
  `resource-list`, `resource-grid`, `section-header`, `meta-row`,
  `detail-meta-grid`, `file-list`.
- Controls and state text: `button`, `text-link`, `badge`, `subtle`,
  `error-text`, `empty-state`, `form-input`, `search-input`.

## State Copy Contracts

These phrases carry product state, not just decoration. Preserve the meaning
unless Codex or Zach explicitly revises the underlying behavior:

- Import is not persistent yet: `未持久化`, `确认入库待接入`, and copy that says
  Neon and R2 writes are not connected.
- Import lane status: `可用`, `待接入`.
- Import step status: `当前切片`, `后续接入`.
- Download state: `来源限制`, `当前无可用下载`, `前往原始来源`, `下载 <file label>`,
  `准备 <file label>...`, `记一笔学习记录`.
- Download error fallback: `下载入口暂时没拿到。`
- Resource list empty state: `没有匹配资源`.

If copy changes are requested for tone, preserve the same behavioral truth:
restricted or external resources stay source explanations and external links;
owned downloads stay behind the server decision gate.

## Non-UI Contracts UI Agents Must Preserve

- `fileId` is the public download/file request identifier. Do not reintroduce
  `filePath` as a browser-facing protocol.
- UI components receive view models from `app/lib/resource-view-models.ts`; they
  must not infer raw download policy from content JSON.
- Browser local study state remains in `app/lib/local-first.ts`.
- R2 bucket names, storage keys, signed URL creation, rate limiting, and budget
  mode remain server-side.
- Authored content under `content/` and generated indexes under
  `content/generated/` are not presentation-only surfaces.
