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
  {
    id: "cet4-paper-current",
    level: "cet4",
    type: "papers",
    title: "2024年6月四级真题",
    summary: "Current CET-4 paper.",
    year: 2024,
    source: "自建整理",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: ["真题", "阅读"],
    files: [],
  },
];

describe("json resource repository", () => {
  it("sorts resources by year descending and title ascending", async () => {
    const repository = createJsonResourceRepository(fixtureResources);

    const items = await repository.list();

    expect(items.map((item) => item.id)).toEqual([
      "cet6-paper-new",
      "cet4-paper-current",
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
