# CET Service Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 domain/service boundary from the CET workbench refactor design while preserving the current JSON content provider.

**Architecture:** Keep route modules thin by moving resource lookup, resource view-model composition, download decisions, and API error formatting into server modules. JSON remains the only provider, but code should depend on a `ResourceRepository` interface so a DB provider can replace it without rewriting UI routes.

**Tech Stack:** React 19, React Router 7 Framework Mode, TypeScript, Zod, Base UI, Vitest, Cloudflare Workers/R2 bindings, npm.

---

## Source Design

Implement Phase 1 from `docs/superpowers/specs/2026-05-22-cet-workbench-refactor-design.md`.

Phase 1 scope only:

- Add repository and service boundaries around existing JSON content.
- Add typed summary/detail/download view models.
- Add `DownloadService` for access decisions.
- Standardize route API error payloads.
- Move raw label and download policy mapping out of UI components.
- Add focused unit tests.

Do not implement DB, object-storage signed URL generation, import flow, vector indexing, or Phase 2 UI redesign in this phase.

## File Structure

- Create `app/lib/resource-view-models.ts`
  - Shared serializable view-model types and label maps used by route components and cards.
  - No server-only imports.
- Create `app/server/api-error.server.ts`
  - Unified `{ error: { code, message } }` payload helper for route APIs.
- Create `app/server/api-error.server.test.ts`
  - Runtime coverage for API error status, payload, and cache header behavior.
- Create `app/server/resource-repository.server.ts`
  - `ResourceRepository` interface.
  - JSON-backed repository using existing `content/cet4/resources.json` and `content/cet6/resources.json`.
- Create `app/server/resource-repository.server.test.ts`
  - Filtering, sorting, and lookup tests against an injected fixture provider.
- Create `app/server/resource-service.server.ts`
  - Resource summary/detail/home/level/search view-model composition.
  - Keeps UI labels and derived counts out of components.
- Create `app/server/resource-service.server.test.ts`
  - View-model, overview, related-resource, and search behavior tests.
- Create `app/server/download-service.server.ts`
  - Download decision service for resource existence, file existence, host mode, policy, and URL selection.
  - Keeps R2/public URL details out of route components.
- Create `app/server/download-service.server.test.ts`
  - Owned download, gateway fallback, missing resource, missing file, and restricted resource tests.
- Modify `app/server/content.server.ts`
  - Replace current logic with a narrow compatibility barrel that re-exports the new server services.
- Modify route modules:
  - `app/routes/home.tsx`
  - `app/routes/level-home.tsx`
  - `app/routes/resource-list.tsx`
  - `app/routes/resource-detail.tsx`
  - `app/routes/api.resources.ts`
  - `app/routes/api.resource.ts`
  - `app/routes/api.search.ts`
  - `app/routes/api.resource-download.ts`
  - `app/routes/api.resource-file.ts`
- Modify components:
  - `app/components/resource-card.tsx`
  - `app/components/download-panel.tsx`
- Keep route ordering in `app/routes.ts` unchanged.

## Task 1: API Error Helper And Shared View Models

**Files:**
- Create: `app/server/api-error.server.ts`
- Create: `app/server/api-error.server.test.ts`
- Create: `app/lib/resource-view-models.ts`

- [ ] **Step 1: Write the failing API error tests**

Create `app/server/api-error.server.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { apiErrorPayload, jsonError } from "~/server/api-error.server";

describe("api error helpers", () => {
  it("creates the normalized API error payload", () => {
    expect(apiErrorPayload("resource_not_found", "资源不存在")).toEqual({
      error: {
        code: "resource_not_found",
        message: "资源不存在",
      },
    });
  });

  it("returns JSON errors with no-store by default", async () => {
    const response = jsonError("file_not_found", "文件不存在", 404);

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: {
        code: "file_not_found",
        message: "文件不存在",
      },
    });
  });

  it("merges caller headers without losing the error cache policy", () => {
    const response = jsonError("download_not_supported", "该资源不支持站内下载", 400, {
      headers: {
        "x-test": "yes",
      },
    });

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-test")).toBe("yes");
  });
});
```

- [ ] **Step 2: Run the API error test and verify it fails**

Run:

```bash
npm test -- app/server/api-error.server.test.ts
```

Expected: FAIL because `~/server/api-error.server` does not exist.

- [ ] **Step 3: Implement the API error helper**

Create `app/server/api-error.server.ts`:

```ts
export type ApiErrorCode =
  | "resource_not_found"
  | "file_not_found"
  | "download_not_supported"
  | "invalid_request"
  | "storage_object_missing";

export type ApiErrorPayload = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export function apiErrorPayload(
  code: ApiErrorCode,
  message: string,
): ApiErrorPayload {
  return {
    error: {
      code,
      message,
    },
  };
}

export function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");

  return Response.json(apiErrorPayload(code, message), {
    ...init,
    status,
    headers,
  });
}
```

- [ ] **Step 4: Add shared resource view-model types**

Create `app/lib/resource-view-models.ts`:

```ts
import type {
  DownloadPolicy,
  ExamLevel,
  HostMode,
  LicenseStatus,
  ResourceFile,
  ResourceType,
} from "~/lib/resources";

type ResourceFileKind = ResourceFile["kind"];

export const hostModeLabel: Record<HostMode, string> = {
  owned: "站内托管",
  restricted: "来源受限",
  external: "外部来源",
};

export const licenseStatusLabel: Record<LicenseStatus, string> = {
  owned: "可控授权",
  restricted: "受限资源",
  external: "外部授权",
};

export const fileKindLabel: Record<ResourceFileKind, string> = {
  pdf: "PDF",
  audio: "Audio",
  zip: "ZIP",
  image: "Image",
};

export type ResourceSummaryView = {
  id: string;
  level: ExamLevel;
  levelLabel: string;
  type: ResourceType;
  typeLabel: string;
  title: string;
  summary: string;
  year: number;
  source: string;
  tags: string[];
  tagLine: string;
  fileCount: number;
  cacheableFileCount: number;
};

export type ResourceFactView = {
  label: string;
  value: string;
};

export type ResourceFileView = {
  label: string;
  kind: ResourceFileKind;
  kindLabel: string;
  path: string;
  cacheable: boolean;
  cacheLabel: string;
};

export type ResourceDownloadPanelView =
  | {
      mode: "owned";
      title: string;
      description: string;
      resourceId: string;
      resourceType: ResourceType;
      files: ResourceFileView[];
      fileCount: number;
      cacheableFileCount: number;
    }
  | {
      mode: "external";
      title: string;
      description: string;
      externalUrl: string;
    }
  | {
      mode: "unavailable";
      title: string;
      description: string;
    };

export type ResourceDetailView = ResourceSummaryView & {
  externalUrl: string | null;
  hostMode: HostMode;
  hostModeLabel: string;
  licenseStatus: LicenseStatus;
  licenseStatusLabel: string;
  downloadPolicy: DownloadPolicy;
  files: ResourceFileView[];
  facts: ResourceFactView[];
  download: ResourceDownloadPanelView;
  related: ResourceSummaryView[];
};

export type ResourceBucketOverviewView = {
  type: ResourceType;
  label: string;
  count: number;
  latest: ResourceSummaryView[];
};

export type LevelOverviewView = {
  level: ExamLevel;
  label: string;
  total: number;
  buckets: ResourceBucketOverviewView[];
};

export type HomeOverviewView = {
  levels: LevelOverviewView[];
  highlights: ResourceSummaryView[];
};
```

- [ ] **Step 5: Run the API error test and typecheck the new shared types**

Run:

```bash
npm test -- app/server/api-error.server.test.ts
npm run typecheck
```

Expected: API error tests pass. Typecheck should pass after React Router typegen completes.

- [ ] **Step 6: Commit Task 1**

```bash
git add app/server/api-error.server.ts app/server/api-error.server.test.ts app/lib/resource-view-models.ts
git commit -m "refactor: add API errors and resource view models"
```

## Task 2: JSON Resource Repository

**Files:**
- Create: `app/server/resource-repository.server.ts`
- Create: `app/server/resource-repository.server.test.ts`

- [ ] **Step 1: Write the failing repository tests**

Create `app/server/resource-repository.server.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createJsonResourceRepository } from "~/server/resource-repository.server";

const fixtureResources = [
  {
    id: "cet4-paper-old",
    level: "cet4",
    type: "papers",
    title: "2023年6月四级真题",
    summary: "Older CET-4 paper.",
    year: 2023,
    source: "自建整理",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: ["真题", "阅读"],
    files: [
      {
        label: "试卷 PDF",
        kind: "pdf",
        path: "papers/cet4-paper-old.pdf",
        cacheable: true,
      },
    ],
  },
  {
    id: "cet6-paper-new",
    level: "cet6",
    type: "papers",
    title: "2025年6月六级真题",
    summary: "Newer CET-6 paper.",
    year: 2025,
    source: "自建整理",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: ["真题", "听力"],
    files: [],
  },
  {
    id: "cet4-listening-guide",
    level: "cet4",
    type: "listening",
    title: "四级听力平台导览",
    summary: "External listening guidance.",
    year: 2024,
    source: "编辑部整理",
    licenseStatus: "restricted",
    hostMode: "restricted",
    downloadPolicy: "none",
    externalUrl: "https://example.com/listening",
    tags: ["听力", "平台资源"],
    files: [],
  },
];

describe("json resource repository", () => {
  it("sorts resources by year descending and title ascending", async () => {
    const repository = createJsonResourceRepository(fixtureResources);

    const items = await repository.list();

    expect(items.map((item) => item.id)).toEqual([
      "cet6-paper-new",
      "cet4-listening-guide",
      "cet4-paper-old",
    ]);
  });

  it("filters by level, type, and query", async () => {
    const repository = createJsonResourceRepository(fixtureResources);

    const items = await repository.list({
      level: "cet4",
      type: "listening",
      query: "平台",
    });

    expect(items.map((item) => item.id)).toEqual(["cet4-listening-guide"]);
  });

  it("finds one resource by id", async () => {
    const repository = createJsonResourceRepository(fixtureResources);

    await expect(repository.findById("cet4-paper-old")).resolves.toMatchObject({
      id: "cet4-paper-old",
      title: "2023年6月四级真题",
    });
    await expect(repository.findById("missing")).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run the repository test and verify it fails**

Run:

```bash
npm test -- app/server/resource-repository.server.test.ts
```

Expected: FAIL because `~/server/resource-repository.server` does not exist.

- [ ] **Step 3: Implement the repository interface and JSON provider**

Create `app/server/resource-repository.server.ts`:

```ts
import cet4ResourcesJson from "../../content/cet4/resources.json";
import cet6ResourcesJson from "../../content/cet6/resources.json";

import {
  resourceCollectionSchema,
  type ExamLevel,
  type ResourceRecord,
  type ResourceType,
} from "~/lib/resources";

export type ResourceFilters = {
  level?: ExamLevel;
  type?: ResourceType;
  query?: string;
};

export type ResourceRepository = {
  list(filters?: ResourceFilters): Promise<ResourceRecord[]>;
  findById(resourceId: string): Promise<ResourceRecord | null>;
};

function matchesQuery(resource: ResourceRecord, query: string) {
  return [resource.title, resource.summary, resource.tags.join(" ")]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function createJsonResourceRepository(input: unknown[]): ResourceRepository {
  const resources = resourceCollectionSchema
    .parse(input)
    .sort(
      (left, right) =>
        right.year - left.year || left.title.localeCompare(right.title, "zh-CN"),
    );

  return {
    async list(filters: ResourceFilters = {}) {
      const normalizedQuery = filters.query?.trim().toLowerCase();

      return resources.filter((resource) => {
        if (filters.level && resource.level !== filters.level) {
          return false;
        }

        if (filters.type && resource.type !== filters.type) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return matchesQuery(resource, normalizedQuery);
      });
    },

    async findById(resourceId: string) {
      return resources.find((resource) => resource.id === resourceId) ?? null;
    },
  };
}

export const jsonResourceRepository = createJsonResourceRepository([
  ...cet4ResourcesJson,
  ...cet6ResourcesJson,
]);
```

- [ ] **Step 4: Run the repository test**

Run:

```bash
npm test -- app/server/resource-repository.server.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add app/server/resource-repository.server.ts app/server/resource-repository.server.test.ts
git commit -m "refactor: add JSON resource repository"
```

## Task 3: Resource Service And View-Model Composition

**Files:**
- Create: `app/server/resource-service.server.ts`
- Create: `app/server/resource-service.server.test.ts`

- [ ] **Step 1: Write the failing resource service tests**

Create `app/server/resource-service.server.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createJsonResourceRepository } from "~/server/resource-repository.server";
import {
  getHomeOverview,
  getLevelOverview,
  getResourceDetail,
  listResourceSummaries,
  searchResourceSummaries,
} from "~/server/resource-service.server";

const fixtureResources = [
  {
    id: "cet4-paper-2025",
    level: "cet4",
    type: "papers",
    title: "2025年6月四级真题",
    summary: "含试卷与听力。",
    year: 2025,
    source: "自建整理",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: ["真题", "听力"],
    files: [
      {
        label: "试卷 PDF",
        kind: "pdf",
        path: "papers/cet4-paper-2025.pdf",
        cacheable: true,
      },
      {
        label: "听力音频",
        kind: "audio",
        path: "audio/cet4-paper-2025.mp3",
        cacheable: false,
      },
    ],
  },
  {
    id: "cet4-listening-guide",
    level: "cet4",
    type: "listening",
    title: "四级听力平台导览",
    summary: "说明外部平台边界。",
    year: 2024,
    source: "编辑部整理",
    licenseStatus: "restricted",
    hostMode: "restricted",
    downloadPolicy: "none",
    externalUrl: "https://example.com/listening",
    tags: ["听力", "平台资源"],
    files: [],
  },
  {
    id: "cet6-writing",
    level: "cet6",
    type: "resources",
    title: "六级写作资源",
    summary: "写作模板。",
    year: 2025,
    source: "自建整理",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: ["写作"],
    files: [],
  },
];

const repository = createJsonResourceRepository(fixtureResources);

describe("resource service", () => {
  it("returns summary view models without file bodies", async () => {
    const items = await listResourceSummaries({ level: "cet4" }, repository);

    expect(items[0]).toMatchObject({
      id: "cet4-paper-2025",
      levelLabel: "英语四级",
      typeLabel: "历年真题",
      tagLine: "真题 · 听力",
      fileCount: 2,
      cacheableFileCount: 1,
    });
    expect(items[0]).not.toHaveProperty("files");
  });

  it("returns detail view models with facts, files, download panel, and related summaries", async () => {
    const detail = await getResourceDetail("cet4-paper-2025", repository);

    expect(detail).toMatchObject({
      id: "cet4-paper-2025",
      hostModeLabel: "站内托管",
      licenseStatusLabel: "可控授权",
      download: {
        mode: "owned",
        resourceId: "cet4-paper-2025",
        fileCount: 2,
        cacheableFileCount: 1,
      },
    });
    expect(detail?.facts).toEqual([
      { label: "来源", value: "自建整理" },
      { label: "年份", value: "2025" },
      { label: "托管", value: "站内托管" },
      { label: "授权", value: "可控授权" },
    ]);
    expect(detail?.files[0]).toMatchObject({
      label: "试卷 PDF",
      kindLabel: "PDF",
      cacheLabel: "可手动缓存",
    });
    expect(detail?.related.map((item) => item.id)).toEqual(["cet4-listening-guide"]);
  });

  it("uses an external download panel when only an external source is available", async () => {
    const detail = await getResourceDetail("cet4-listening-guide", repository);

    expect(detail?.download).toEqual({
      mode: "external",
      title: "这类资源不站内托管",
      description: "说明外部平台边界。",
      externalUrl: "https://example.com/listening",
    });
  });

  it("builds level and home overviews from summaries", async () => {
    const level = await getLevelOverview("cet4", repository);
    const home = await getHomeOverview(repository);

    expect(level.total).toBe(2);
    expect(level.buckets.find((bucket) => bucket.type === "papers")).toMatchObject({
      label: "历年真题",
      count: 1,
    });
    expect(home.levels.map((entry) => entry.level)).toEqual(["cet4", "cet6"]);
    expect(home.highlights[0]?.id).toBe("cet4-paper-2025");
  });

  it("searches summaries through the repository query path", async () => {
    const items = await searchResourceSummaries("平台", repository);

    expect(items.map((item) => item.id)).toEqual(["cet4-listening-guide"]);
  });
});
```

- [ ] **Step 2: Run the resource service test and verify it fails**

Run:

```bash
npm test -- app/server/resource-service.server.test.ts
```

Expected: FAIL because `~/server/resource-service.server` does not exist.

- [ ] **Step 3: Implement the resource service**

Create `app/server/resource-service.server.ts`:

```ts
import {
  fileKindLabel,
  hostModeLabel,
  licenseStatusLabel,
  type HomeOverviewView,
  type LevelOverviewView,
  type ResourceDetailView,
  type ResourceDownloadPanelView,
  type ResourceFileView,
  type ResourceSummaryView,
} from "~/lib/resource-view-models";
import {
  levelLabel,
  typeLabel,
  type ExamLevel,
  type ResourceFile,
  type ResourceRecord,
} from "~/lib/resources";
import {
  jsonResourceRepository,
  type ResourceFilters,
  type ResourceRepository,
} from "~/server/resource-repository.server";

const defaultRepository = jsonResourceRepository;

function toTagLine(tags: string[]) {
  return tags.join(" · ");
}

function toResourceFileView(file: ResourceFile): ResourceFileView {
  return {
    ...file,
    kindLabel: fileKindLabel[file.kind],
    cacheLabel: file.cacheable ? "可手动缓存" : "仅在线播放",
  };
}

function toResourceSummary(resource: ResourceRecord): ResourceSummaryView {
  const cacheableFileCount = resource.files.filter((file) => file.cacheable).length;

  return {
    id: resource.id,
    level: resource.level,
    levelLabel: levelLabel[resource.level],
    type: resource.type,
    typeLabel: typeLabel[resource.type],
    title: resource.title,
    summary: resource.summary,
    year: resource.year,
    source: resource.source,
    tags: resource.tags,
    tagLine: toTagLine(resource.tags),
    fileCount: resource.files.length,
    cacheableFileCount,
  };
}

function toDownloadPanel(resource: ResourceRecord): ResourceDownloadPanelView {
  if (
    resource.downloadPolicy === "signed" &&
    resource.hostMode === "owned" &&
    resource.files.length > 0
  ) {
    const files = resource.files.map(toResourceFileView);

    return {
      mode: "owned",
      title: "站内可控下载",
      description: "下载前会先经过服务端策略检查。",
      resourceId: resource.id,
      resourceType: resource.type,
      files,
      fileCount: files.length,
      cacheableFileCount: files.filter((file) => file.cacheable).length,
    };
  }

  if (resource.externalUrl) {
    return {
      mode: "external",
      title: "这类资源不站内托管",
      description: resource.summary,
      externalUrl: resource.externalUrl,
    };
  }

  return {
    mode: "unavailable",
    title: "当前无可用下载",
    description: resource.summary,
  };
}

async function listRelatedResourceSummaries(
  resource: ResourceRecord,
  repository: ResourceRepository,
  limit = 3,
) {
  const candidates = await repository.list({ level: resource.level });

  return candidates
    .filter((entry) => entry.id !== resource.id && entry.type !== resource.type)
    .slice(0, limit)
    .map(toResourceSummary);
}

export async function listResourceSummaries(
  filters: ResourceFilters = {},
  repository: ResourceRepository = defaultRepository,
) {
  const resources = await repository.list(filters);
  return resources.map(toResourceSummary);
}

export async function searchResourceSummaries(
  query: string,
  repository: ResourceRepository = defaultRepository,
) {
  return listResourceSummaries({ query }, repository);
}

export async function getResourceDetail(
  resourceId: string,
  repository: ResourceRepository = defaultRepository,
): Promise<ResourceDetailView | null> {
  const resource = await repository.findById(resourceId);

  if (!resource) {
    return null;
  }

  return {
    ...toResourceSummary(resource),
    externalUrl: resource.externalUrl,
    hostMode: resource.hostMode,
    hostModeLabel: hostModeLabel[resource.hostMode],
    licenseStatus: resource.licenseStatus,
    licenseStatusLabel: licenseStatusLabel[resource.licenseStatus],
    downloadPolicy: resource.downloadPolicy,
    files: resource.files.map(toResourceFileView),
    facts: [
      { label: "来源", value: resource.source },
      { label: "年份", value: String(resource.year) },
      { label: "托管", value: hostModeLabel[resource.hostMode] },
      { label: "授权", value: licenseStatusLabel[resource.licenseStatus] },
    ],
    download: toDownloadPanel(resource),
    related: await listRelatedResourceSummaries(resource, repository),
  };
}

export async function getLevelOverview(
  level: ExamLevel,
  repository: ResourceRepository = defaultRepository,
): Promise<LevelOverviewView> {
  const levelResources = await repository.list({ level });

  const buckets = Object.entries(typeLabel).map(([type, label]) => {
    const matches = levelResources.filter((resource) => resource.type === type);

    return {
      type: type as keyof typeof typeLabel,
      label,
      count: matches.length,
      latest: matches.slice(0, 2).map(toResourceSummary),
    };
  });

  return {
    level,
    label: levelLabel[level],
    total: levelResources.length,
    buckets,
  };
}

export async function getHomeOverview(
  repository: ResourceRepository = defaultRepository,
): Promise<HomeOverviewView> {
  const [cet4, cet6, allResources] = await Promise.all([
    getLevelOverview("cet4", repository),
    getLevelOverview("cet6", repository),
    repository.list(),
  ]);

  return {
    levels: [cet4, cet6],
    highlights: allResources.slice(0, 5).map(toResourceSummary),
  };
}
```

- [ ] **Step 4: Run service and repository tests**

Run:

```bash
npm test -- app/server/resource-repository.server.test.ts app/server/resource-service.server.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add app/server/resource-service.server.ts app/server/resource-service.server.test.ts
git commit -m "refactor: add resource service view models"
```

## Task 4: Download Service

**Files:**
- Create: `app/server/download-service.server.ts`
- Create: `app/server/download-service.server.test.ts`

- [ ] **Step 1: Write the failing download service tests**

Create `app/server/download-service.server.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { decideResourceDownload, getOwnedResourceFile } from "~/server/download-service.server";
import { createJsonResourceRepository } from "~/server/resource-repository.server";

const fixtureResources = [
  {
    id: "owned-paper",
    level: "cet4",
    type: "papers",
    title: "Owned Paper",
    summary: "Owned file.",
    year: 2025,
    source: "自建整理",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: ["真题"],
    files: [
      {
        label: "试卷 PDF",
        kind: "pdf",
        path: "papers/owned-paper.pdf",
        cacheable: true,
      },
    ],
  },
  {
    id: "restricted-guide",
    level: "cet4",
    type: "listening",
    title: "Restricted Guide",
    summary: "Restricted resource.",
    year: 2025,
    source: "编辑部整理",
    licenseStatus: "restricted",
    hostMode: "restricted",
    downloadPolicy: "none",
    externalUrl: "https://example.com/source",
    tags: ["平台资源"],
    files: [],
  },
];

const repository = createJsonResourceRepository(fixtureResources);

describe("download service", () => {
  it("returns a public-base download URL for owned files", async () => {
    const result = await decideResourceDownload({
      resourceId: "owned-paper",
      filePath: "papers/owned-paper.pdf",
      requestUrl: "https://cet.example/api/resources/owned-paper/download",
      publicBaseUrl: "https://cdn.example/resources/",
      repository,
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      payload: {
        kind: "signed",
        reasonCode: "owned_file_available",
        url: "https://cdn.example/resources/papers/owned-paper.pdf",
        file: {
          label: "试卷 PDF",
          path: "papers/owned-paper.pdf",
          cacheable: true,
        },
      },
    });
  });

  it("returns a gateway URL when no public base is configured", async () => {
    const result = await decideResourceDownload({
      resourceId: "owned-paper",
      filePath: "papers/owned-paper.pdf",
      requestUrl: "https://cet.example/api/resources/owned-paper/download",
      publicBaseUrl: "",
      repository,
    });

    expect(result.ok).toBe(true);
    expect(result.ok ? result.payload.url : "").toBe(
      "https://cet.example/api/resources/owned-paper/file?path=papers%2Fowned-paper.pdf",
    );
  });

  it("denies missing resources and missing files", async () => {
    await expect(
      decideResourceDownload({
        resourceId: "missing",
        filePath: "papers/owned-paper.pdf",
        requestUrl: "https://cet.example/api/resources/missing/download",
        repository,
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 404,
      error: {
        code: "resource_not_found",
        message: "资源不存在",
      },
    });

    await expect(
      decideResourceDownload({
        resourceId: "owned-paper",
        filePath: "missing.pdf",
        requestUrl: "https://cet.example/api/resources/owned-paper/download",
        repository,
      }),
    ).resolves.toMatchObject({
      ok: false,
      status: 404,
      error: {
        code: "file_not_found",
        message: "文件不存在",
      },
    });
  });

  it("denies restricted resources before any storage lookup", async () => {
    const result = await decideResourceDownload({
      resourceId: "restricted-guide",
      filePath: "anything.pdf",
      requestUrl: "https://cet.example/api/resources/restricted-guide/download",
      repository,
    });

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      error: {
        code: "download_not_supported",
        message: "该资源不支持站内下载",
      },
    });
  });

  it("validates gateway file access with the same owned-resource policy", async () => {
    const result = await getOwnedResourceFile({
      resourceId: "owned-paper",
      filePath: "papers/owned-paper.pdf",
      repository,
    });

    expect(result).toMatchObject({
      ok: true,
      resourceId: "owned-paper",
      file: {
        label: "试卷 PDF",
        path: "papers/owned-paper.pdf",
      },
    });
  });
});
```

- [ ] **Step 2: Run the download service test and verify it fails**

Run:

```bash
npm test -- app/server/download-service.server.test.ts
```

Expected: FAIL because `~/server/download-service.server` does not exist.

- [ ] **Step 3: Implement the download service**

Create `app/server/download-service.server.ts`:

```ts
import type { ApiErrorCode } from "~/server/api-error.server";
import {
  jsonResourceRepository,
  type ResourceRepository,
} from "~/server/resource-repository.server";

type DownloadFilePayload = {
  label: string;
  path: string;
  cacheable: boolean;
};

type DownloadSuccess = {
  ok: true;
  status: 200;
  payload: {
    kind: "signed";
    reasonCode: "owned_file_available";
    url: string;
    file: DownloadFilePayload;
  };
};

type DownloadFailure = {
  ok: false;
  status: 400 | 404;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

type DownloadDecisionInput = {
  resourceId: string;
  filePath?: string | null;
  requestUrl: string;
  publicBaseUrl?: string | null;
  repository?: ResourceRepository;
};

type OwnedResourceFileInput = {
  resourceId: string;
  filePath?: string | null;
  repository?: ResourceRepository;
};

type OwnedResourceFileResult =
  | {
      ok: true;
      resourceId: string;
      file: DownloadFilePayload;
    }
  | DownloadFailure;

function failure(
  code: ApiErrorCode,
  message: string,
  status: 400 | 404,
): DownloadFailure {
  return {
    ok: false,
    status,
    error: {
      code,
      message,
    },
  };
}

function toDownloadFilePayload(file: {
  label: string;
  path: string;
  cacheable: boolean;
}): DownloadFilePayload {
  return {
    label: file.label,
    path: file.path,
    cacheable: file.cacheable,
  };
}

function buildDownloadUrl(
  requestUrl: string,
  resourceId: string,
  filePath: string,
  publicBaseUrl?: string | null,
) {
  const publicBase = publicBaseUrl?.trim();

  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${filePath}`;
  }

  const url = new URL(requestUrl);
  url.pathname = `/api/resources/${resourceId}/file`;
  url.search = "";
  url.searchParams.set("path", filePath);
  return url.toString();
}

export async function getOwnedResourceFile({
  resourceId,
  filePath,
  repository = jsonResourceRepository,
}: OwnedResourceFileInput): Promise<OwnedResourceFileResult> {
  const resource = await repository.findById(resourceId);

  if (!resource) {
    return failure("resource_not_found", "资源不存在", 404);
  }

  if (resource.hostMode !== "owned" || resource.downloadPolicy !== "signed") {
    return failure("download_not_supported", "该资源不支持站内下载", 400);
  }

  const file = resource.files.find((entry) => entry.path === filePath);

  if (!file) {
    return failure("file_not_found", "文件不存在", 404);
  }

  return {
    ok: true,
    resourceId: resource.id,
    file: toDownloadFilePayload(file),
  };
}

export async function decideResourceDownload({
  resourceId,
  filePath,
  requestUrl,
  publicBaseUrl,
  repository = jsonResourceRepository,
}: DownloadDecisionInput): Promise<DownloadSuccess | DownloadFailure> {
  const ownedFile = await getOwnedResourceFile({
    resourceId,
    filePath,
    repository,
  });

  if (!ownedFile.ok) {
    return ownedFile;
  }

  return {
    ok: true,
    status: 200,
    payload: {
      kind: "signed",
      reasonCode: "owned_file_available",
      url: buildDownloadUrl(requestUrl, resourceId, ownedFile.file.path, publicBaseUrl),
      file: ownedFile.file,
    },
  };
}
```

- [ ] **Step 4: Run download service tests**

Run:

```bash
npm test -- app/server/download-service.server.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add app/server/download-service.server.ts app/server/download-service.server.test.ts
git commit -m "refactor: add download decision service"
```

## Task 5: Wire Routes And Components To Services

**Files:**
- Modify: `app/routes/home.tsx`
- Modify: `app/routes/level-home.tsx`
- Modify: `app/routes/resource-list.tsx`
- Modify: `app/routes/resource-detail.tsx`
- Modify: `app/routes/api.resources.ts`
- Modify: `app/routes/api.resource.ts`
- Modify: `app/routes/api.search.ts`
- Modify: `app/routes/api.resource-download.ts`
- Modify: `app/routes/api.resource-file.ts`
- Modify: `app/components/resource-card.tsx`
- Modify: `app/components/download-panel.tsx`

- [ ] **Step 1: Update `ResourceCard` to consume summary view models**

In `app/components/resource-card.tsx`, replace the resource type import:

```ts
import type { ResourceSummaryView } from "~/lib/resource-view-models";
```

Use this prop type:

```ts
export function ResourceCard({
  resource,
  variant = "card",
}: {
  resource: ResourceSummaryView;
  variant?: "card" | "list";
}) {
```

Replace badge and tag rendering with view-model fields:

```tsx
<span className="badge">{resource.levelLabel}</span>
<span className="badge">{resource.typeLabel}</span>
<span className="badge subtle">{resource.source}</span>
```

```tsx
<span>{resource.tagLine}</span>
```

- [ ] **Step 2: Update `DownloadPanel` to consume the download panel view model**

In `app/components/download-panel.tsx`, replace the resource type import:

```ts
import type { ResourceDownloadPanelView } from "~/lib/resource-view-models";
```

Use this prop type:

```ts
export function DownloadPanel({ download }: { download: ResourceDownloadPanelView }) {
```

Move the external/unavailable branch before the owned-only functions so TypeScript narrows `download` to the owned variant before `handleDownload()` and `markStudy()` read `resourceId` and `resourceType`.

After that branch, replace `resource.id` in the fetch URL with `download.resourceId`:

```ts
const response = await fetch(`/api/resources/${download.resourceId}/download`, {
```

Replace the local study record values:

```ts
await store.recordStudy({
  resourceId: download.resourceId,
  durationMinutes: download.resourceType === "listening" ? 20 : 30,
  bucket: download.resourceType,
  note: "从资源详情页手动记录",
});
```

Replace the restricted/unavailable branch:

```tsx
if (download.mode === "external" || download.mode === "unavailable") {
  return (
    <section className="glass-card action-panel">
      <div className="section-kicker">来源限制</div>
      <h3>{download.title}</h3>
      <p>{download.description}</p>
      {download.mode === "external" ? (
        <a
          className={buttonClassName({ variant: "primary" })}
          href={download.externalUrl}
          target="_blank"
          rel="noreferrer"
        >
          前往原始来源
        </a>
      ) : (
        <Button disabled>
          当前无可用下载
        </Button>
      )}
    </section>
  );
}
```

Replace the owned branch counts and files:

```tsx
<h3>{download.title}</h3>
<div className="action-panel__summary" aria-label="下载概览">
  <div>
    <strong>{download.fileCount}</strong>
    <span>文件</span>
  </div>
  <div>
    <strong>{download.cacheableFileCount}</strong>
    <span>可缓存</span>
  </div>
</div>
<div className="action-stack">
  {download.files.map((file) => (
    <Button
      key={file.path}
      variant="primary"
      onClick={() => handleDownload(file.path, file.label, file.cacheable)}
      disabled={state.kind === "loading"}
      focusableWhenDisabled
    >
      {state.kind === "loading" && state.fileLabel === file.label
        ? `准备 ${file.label}…`
        : `下载 ${file.label}`}
    </Button>
  ))}
  <Button onClick={markStudy}>
    记一笔学习记录
  </Button>
</div>
```

Replace the footer copy:

```tsx
<p className="meta-line">
  下载入口会先经过服务端策略检查。
</p>
```

Update error parsing for normalized API errors:

```ts
const payload = (await response.json().catch(() => null)) as
  | { error?: { message?: string } }
  | null;
setState({
  kind: "error",
  message: payload?.error?.message ?? "下载入口暂时没拿到。",
});
```

- [ ] **Step 3: Update page route imports to use `ResourceService`**

In `app/routes/home.tsx`, import from the service:

```ts
import { getHomeOverview } from "~/server/resource-service.server";
```

In `app/routes/level-home.tsx`, import from the service:

```ts
import { getLevelOverview } from "~/server/resource-service.server";
```

In `app/routes/resource-list.tsx`, import from the service:

```ts
import { listResourceSummaries } from "~/server/resource-service.server";
```

Then replace the list loader call:

```ts
const items = await listResourceSummaries({
  level,
  type,
  query: q,
});
```

- [ ] **Step 4: Update `resource-detail.tsx` to use detail view models**

Replace the service imports:

```ts
import { getResourceDetail } from "~/server/resource-service.server";
```

Remove local `hostModeLabel` and `licenseStatusLabel` constants from `app/routes/resource-detail.tsx`.

Replace the loader:

```ts
export async function loader({ params }: Route.LoaderArgs) {
  const detail = await getResourceDetail(params.resourceId);
  if (!detail) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    detail,
  };
}
```

Replace `meta()`:

```ts
export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data?.detail.title ?? "资源详情"} · CET 备考工作台` },
    { name: "description", content: data?.detail.summary ?? "资源详情页" },
  ];
}
```

Replace component data destructuring:

```ts
const { detail } = loaderData;
```

Use detail labels in `SiteShell`:

```tsx
<SiteShell
  title={detail.title}
  description={detail.summary}
  eyebrow={`${detail.levelLabel} · ${detail.typeLabel}`}
  level={detail.level}
>
```

Replace title/action header:

```tsx
<h2>{detail.download.title}</h2>
<FavoriteButton resourceId={detail.id} />
```

Replace metadata grid:

```tsx
<div className="detail-meta-grid" aria-label="资源元信息">
  {detail.facts.map((fact) => (
    <div key={fact.label}>
      <span>{fact.label}</span>
      <strong>{fact.value}</strong>
    </div>
  ))}
</div>
```

Replace tags:

```tsx
<span>{detail.tagLine}</span>
```

Replace file list:

```tsx
{detail.files.map((file) => (
  <li key={file.path}>
    <div>
      <strong>{file.label}</strong>
      <span>{file.kindLabel}</span>
    </div>
    <span>{file.cacheLabel}</span>
  </li>
))}
```

Replace sidebar download panel and link:

```tsx
<DownloadPanel download={detail.download} />
```

```tsx
<Link className={buttonClassName()} to={`/${detail.level}/${detail.type}`}>
  回到 {detail.typeLabel}
</Link>
```

Replace related rendering:

```tsx
{detail.related.length > 0 ? (
```

```tsx
{detail.related.map((item) => (
  <ResourceCard key={item.id} resource={item} />
))}
```

- [ ] **Step 5: Update API routes to use services and normalized errors**

In `app/routes/api.resources.ts`, replace imports:

```ts
import { examLevelSchema, resourceTypeSchema } from "~/lib/resources";
import { listResourceSummaries } from "~/server/resource-service.server";
```

Replace the loader body:

```ts
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const level = examLevelSchema.safeParse(url.searchParams.get("level"));
  const type = resourceTypeSchema.safeParse(url.searchParams.get("type"));
  const q = url.searchParams.get("q") ?? undefined;

  const resources = await listResourceSummaries({
    level: level.success ? level.data : undefined,
    type: type.success ? type.data : undefined,
    query: q,
  });

  return Response.json(
    { items: resources },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
}
```

In `app/routes/api.resource.ts`, replace imports:

```ts
import { jsonError } from "~/server/api-error.server";
import { getResourceDetail } from "~/server/resource-service.server";
```

Replace the loader body:

```ts
export async function loader({ params }: Route.LoaderArgs) {
  const resource = await getResourceDetail(params.resourceId);
  if (!resource) {
    return jsonError("resource_not_found", "资源不存在", 404);
  }

  return Response.json(resource, {
    headers: {
      "cache-control": "public, max-age=60",
    },
  });
}
```

In `app/routes/api.search.ts`, replace the direct search index import with:

```ts
import { searchResourceSummaries } from "~/server/resource-service.server";
```

Replace the loader body:

```ts
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const items = await searchResourceSummaries(query);

  return Response.json(
    { items },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
}
```

- [ ] **Step 6: Update download API routes to use `DownloadService`**

In `app/routes/api.resource-download.ts`, replace imports:

```ts
import { jsonError } from "~/server/api-error.server";
import { decideResourceDownload } from "~/server/download-service.server";
```

Replace the action body:

```ts
export async function action({ request, params, context }: Route.ActionArgs) {
  const body = (await request.json().catch(() => null)) as
    | { filePath?: string }
    | null;

  const decision = await decideResourceDownload({
    resourceId: params.resourceId,
    filePath: body?.filePath,
    requestUrl: request.url,
    publicBaseUrl: context.cloudflare.env.R2_PUBLIC_BASE_URL,
  });

  if (!decision.ok) {
    return jsonError(
      decision.error.code,
      decision.error.message,
      decision.status,
    );
  }

  return Response.json(decision.payload, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
```

In `app/routes/api.resource-file.ts`, replace imports:

```ts
import { jsonError } from "~/server/api-error.server";
import { getOwnedResourceFile } from "~/server/download-service.server";
```

Replace lookup and error handling:

```ts
const url = new URL(request.url);
const path = url.searchParams.get("path");
const result = await getOwnedResourceFile({
  resourceId: params.resourceId,
  filePath: path,
});

if (!result.ok) {
  return jsonError(result.error.code, result.error.message, result.status);
}

const object = await context.cloudflare.env.RESOURCE_BUCKET.get(result.file.path);
if (!object) {
  return jsonError("storage_object_missing", "文件暂时不可用", 404);
}
```

Replace the content-disposition filename source:

```ts
`attachment; filename*=UTF-8''${encodeURIComponent(result.file.path.split("/").pop() ?? result.file.label)}`,
```

- [ ] **Step 7: Replace `content.server.ts` with a compatibility barrel**

After all route imports have moved off the old helper names, replace `app/server/content.server.ts`:

```ts
export { jsonResourceRepository } from "~/server/resource-repository.server";
export type {
  ResourceFilters,
  ResourceRepository,
} from "~/server/resource-repository.server";
export {
  getHomeOverview,
  getLevelOverview,
  getResourceDetail,
  listResourceSummaries,
  searchResourceSummaries,
} from "~/server/resource-service.server";
export {
  decideResourceDownload,
  getOwnedResourceFile,
} from "~/server/download-service.server";
```

- [ ] **Step 8: Run the full test suite**

Run:

```bash
npm test
```

Expected: all existing tests and new server tests pass.

- [ ] **Step 9: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit Task 5**

```bash
git add app/routes app/components app/server/content.server.ts
git commit -m "refactor: wire routes to resource services"
```

## Task 6: Build Verification And Browser Smoke

**Files:**
- No planned source changes unless verification finds a regression.

- [ ] **Step 1: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. The content index should build before the React Router build through `prebuild`.

- [ ] **Step 2: Start the dev server**

Run:

```bash
npm run dev
```

Expected: dev server prints a local URL.

- [ ] **Step 3: Browser smoke the required routes**

Open the dev server URL and verify:

- `/`
- `/cet4/papers`
- `/resources/cet4-paper-2024-12-a`

Expected:

- No console errors.
- Resource list renders summaries from `ResourceService`.
- Detail page renders facts and file labels from `ResourceDetailView`.
- Download panel uses normalized API error payloads if a download request fails.
- Favorite toggle still updates local-first state.
- Theme toggle still updates.
- Search form remains accessible and submits correctly.
- No text overlap at desktop and narrow widths.

- [ ] **Step 4: Stop the dev server**

Stop the running `npm run dev` process with `Ctrl-C`.

- [ ] **Step 5: Check final diff and working tree**

Run:

```bash
git status --short
git diff --stat
```

Expected:

- Only intentional Phase 1 files are changed.
- Existing unrelated `pnpm-lock.yaml` and `pnpm-workspace.yaml` changes remain excluded unless Zach separately asks to handle them.

- [ ] **Step 6: Commit any verification fixes**

If verification required fixes, commit only the files changed for those fixes:

```bash
git add app/lib/resource-view-models.ts app/server/api-error.server.ts app/server/api-error.server.test.ts app/server/resource-repository.server.ts app/server/resource-repository.server.test.ts app/server/resource-service.server.ts app/server/resource-service.server.test.ts app/server/download-service.server.ts app/server/download-service.server.test.ts app/server/content.server.ts app/routes/home.tsx app/routes/level-home.tsx app/routes/resource-list.tsx app/routes/resource-detail.tsx app/routes/api.resources.ts app/routes/api.resource.ts app/routes/api.search.ts app/routes/api.resource-download.ts app/routes/api.resource-file.ts app/components/resource-card.tsx app/components/download-panel.tsx
git commit -m "fix: stabilize resource service boundary"
```

If no verification fixes were needed, skip this commit step and report the successful verification commands.

## Self-Review Notes

- Spec coverage:
  - Repository/provider boundary is covered by Task 2.
  - ResourceService view models are covered by Task 3.
  - DownloadService policy ownership is covered by Task 4.
  - API error shape is covered by Task 1 and Task 5.
  - UI no longer maps host/license/download labels directly after Task 5.
  - DB, import, R2 signed URL hardening, vectors, and large UI redesign are intentionally outside Phase 1.
- Type consistency:
  - Route pages consume `ResourceSummaryView`, `ResourceDetailView`, and `ResourceDownloadPanelView`.
  - Server-only providers stay in `app/server/*.server.ts`.
  - Shared UI model types stay in `app/lib/resource-view-models.ts`.
- Verification:
  - Unit tests are file-scoped during each task.
  - Final gates use `npm test`, `npm run typecheck`, `npm run build`, and browser smoke per `AGENTS.md`.
