import { describe, expect, it } from "vitest";

import {
  createImportDraft,
  getImportWorkbench,
} from "~/server/import-service.server";

describe("import service", () => {
  it("exposes the first import lane without pretending storage is connected", () => {
    const workbench = getImportWorkbench();

    expect(workbench.lanes).toEqual([
      {
        id: "external-source",
        title: "外部合法来源",
        description: "从来源 URL 生成一份待审核的资源元数据草稿。",
        status: "available",
      },
      {
        id: "owned-file",
        title: "自有文件上传",
        description: "把可控 PDF、音频、压缩包或图片写入 R2。",
        status: "planned",
      },
      {
        id: "manual-record",
        title: "手动资源记录",
        description: "记录暂时不适合托管的材料元信息。",
        status: "planned",
      },
    ]);
    expect(workbench.steps.at(-1)).toMatchObject({
      id: "commit",
      status: "planned",
    });
  });

  it("creates an external-source draft without persisting it", () => {
    const formData = new FormData();
    formData.set("title", "2025 CET-4 Listening Guide");
    formData.set("sourceUrl", "https://example.com/cet4/listening");
    formData.set("sourceName", "Example CET archive");
    formData.set("summary", "Legal source note for a listening guide.");
    formData.set("level", "cet4");
    formData.set("type", "listening");

    const result = createImportDraft(formData);

    expect(result).toEqual({
      ok: true,
      draft: {
        title: "2025 CET-4 Listening Guide",
        sourceUrl: "https://example.com/cet4/listening",
        sourceName: "Example CET archive",
        summary: "Legal source note for a listening guide.",
        level: "cet4",
        levelLabel: "英语四级",
        type: "listening",
        typeLabel: "听力资源",
        hostMode: "external",
        downloadPolicy: "external",
        lifecycleStatus: "draft",
        commitStatus: "not_connected",
      },
    });
  });

  it("returns field errors for an invalid draft request", () => {
    const formData = new FormData();
    formData.set("title", "A");
    formData.set("sourceUrl", "not-a-url");
    formData.set("level", "cet4");
    formData.set("type", "papers");

    const result = createImportDraft(formData);

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        title: ["Title must be at least 2 characters."],
        sourceUrl: ["Source URL must be a valid URL."],
      },
    });
  });
});
