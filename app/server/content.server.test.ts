import { describe, expect, it } from "vitest";

import {
  decideResourceDownload,
  getResourceDetail,
  jsonResourceRepository,
  listResourceSummaries,
} from "~/server/content.server";

describe("content server", () => {
  it("exports summary service models without file bodies", async () => {
    const papers = await listResourceSummaries({
      level: "cet4",
      type: "papers",
    });

    expect(papers).toHaveLength(1);
    expect(papers[0]?.id).toBe("cet4-official-paper-structure");
    expect(papers[0]).not.toHaveProperty("files");
  });

  it("exports detail service models with files", async () => {
    const detail = await getResourceDetail("cet4-exam-day-checklist");

    expect(detail?.title).toBe("英语四级考试当天流程卡");
    expect(detail?.files).toHaveLength(1);
    expect(detail?.facts).toEqual(
      expect.arrayContaining([
        { label: "用法", value: "自制流程卡，可站内托管" },
        { label: "核验", value: "2026-06-06" },
      ]),
    );
  });

  it("exports download service decisions", async () => {
    const owned = await decideResourceDownload({
      resourceId: "cet4-exam-day-checklist",
      fileId: "study-card-html",
      requestUrl:
        "https://cet.example/api/resources/cet4-exam-day-checklist/download",
    });
    const restricted = await decideResourceDownload({
      resourceId: "cet4-official-paper-structure",
      fileId: "study-card-html",
      requestUrl:
        "https://cet.example/api/resources/cet4-official-paper-structure/download",
    });

    expect(owned).toMatchObject({
      ok: true,
      payload: {
        kind: "signed",
      },
    });
    expect(restricted).toMatchObject({
      ok: false,
      error: {
        code: "download_not_supported",
      },
    });
  });

  it("exports the JSON resource repository", async () => {
    const resource = await jsonResourceRepository.findById(
      "cet4-exam-day-checklist",
    );

    expect(resource).toMatchObject({
      id: "cet4-exam-day-checklist",
      hostMode: "owned",
      downloadPolicy: "signed",
    });
    expect(await jsonResourceRepository.list({ level: "cet4" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cet4-exam-day-checklist",
        }),
      ]),
    );
  });
});
