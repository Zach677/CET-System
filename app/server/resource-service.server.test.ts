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
    expect(detail?.files[1]).toMatchObject({
      label: "听力音频",
      kindLabel: "Audio",
      cacheLabel: "仅在线播放",
    });
    expect(detail?.related.map((item) => item.id)).toEqual([
      "cet4-listening-guide",
    ]);
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

  it("returns null when a detail resource is missing", async () => {
    await expect(
      getResourceDetail("missing-resource", repository),
    ).resolves.toBeNull();
  });

  it("uses an unavailable download panel when no download path is available", async () => {
    const unavailableRepository = createJsonResourceRepository([
      {
        id: "cet6-vocabulary-plan",
        level: "cet6",
        type: "skills",
        title: "六级词汇计划",
        summary: "暂不提供下载。",
        year: 2025,
        source: "编辑部整理",
        licenseStatus: "owned",
        hostMode: "owned",
        downloadPolicy: "none",
        externalUrl: null,
        tags: ["词汇"],
        files: [],
      },
    ]);

    const detail = await getResourceDetail(
      "cet6-vocabulary-plan",
      unavailableRepository,
    );

    expect(detail?.download).toEqual({
      mode: "unavailable",
      title: "当前不可下载",
      description: "暂不提供下载。",
    });
  });

  it("builds level and home overviews from summaries", async () => {
    const level = await getLevelOverview("cet4", repository);
    const home = await getHomeOverview(repository);

    expect(level.total).toBe(2);
    expect(
      level.buckets.find((bucket) => bucket.type === "papers"),
    ).toMatchObject({
      label: "历年真题",
      count: 1,
    });
    expect(home.levels.map((entry) => entry.level)).toEqual(["cet4", "cet6"]);
    expect(home.highlights[0]?.id).toBe("cet4-paper-2025");
  });

  it("keeps bucket count complete while capping latest summaries", async () => {
    const overviewRepository = createJsonResourceRepository([
      {
        id: "cet4-paper-2025",
        level: "cet4",
        type: "papers",
        title: "2025年6月四级真题",
        summary: "最新真题。",
        year: 2025,
        source: "自建整理",
        licenseStatus: "owned",
        hostMode: "owned",
        downloadPolicy: "signed",
        externalUrl: null,
        tags: ["真题"],
        files: [],
      },
      {
        id: "cet4-paper-2024",
        level: "cet4",
        type: "papers",
        title: "2024年12月四级真题",
        summary: "上一套真题。",
        year: 2024,
        source: "自建整理",
        licenseStatus: "owned",
        hostMode: "owned",
        downloadPolicy: "signed",
        externalUrl: null,
        tags: ["真题"],
        files: [],
      },
      {
        id: "cet4-paper-2023",
        level: "cet4",
        type: "papers",
        title: "2023年12月四级真题",
        summary: "较早真题。",
        year: 2023,
        source: "自建整理",
        licenseStatus: "owned",
        hostMode: "owned",
        downloadPolicy: "signed",
        externalUrl: null,
        tags: ["真题"],
        files: [],
      },
    ]);

    const level = await getLevelOverview("cet4", overviewRepository);
    const papers = level.buckets.find((bucket) => bucket.type === "papers");

    expect(papers).toMatchObject({
      count: 3,
    });
    expect(papers?.latest).toHaveLength(2);
  });

  it("searches summaries through the repository query path", async () => {
    const items = await searchResourceSummaries("平台", repository);

    expect(items.map((item) => item.id)).toEqual(["cet4-listening-guide"]);
  });
});
