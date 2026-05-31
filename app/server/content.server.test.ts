import { describe, expect, it } from "vitest";

import {
  decideResourceDownload,
  getResourceDetail,
  jsonResourceRepository,
  listResourceSummaries,
} from "~/server/content.server";

describe("content server", () => {
  it("exports summary service models without file bodies", async () => {
    const listening = await listResourceSummaries({
      level: "cet4",
      type: "listening",
    });

    expect(listening).toHaveLength(1);
    expect(listening[0]?.id).toBe("cet4-listening-welearn");
    expect(listening[0]).not.toHaveProperty("files");
  });

  it("exports detail service models with files", async () => {
    const detail = await getResourceDetail("cet6-writing-templates");

    expect(detail?.title).toBe("六级写作模板与高分表达");
    expect(detail?.files).toHaveLength(1);
  });

  it("exports download service decisions", async () => {
    const owned = await decideResourceDownload({
      resourceId: "cet4-paper-2024-12-a",
      filePath: "papers/cet4-paper-2024-12-a.pdf",
      requestUrl:
        "https://cet.example/api/resources/cet4-paper-2024-12-a/download",
    });
    const restricted = await decideResourceDownload({
      resourceId: "cet4-listening-welearn",
      filePath: "anything.pdf",
      requestUrl:
        "https://cet.example/api/resources/cet4-listening-welearn/download",
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
      "cet4-paper-2024-12-a",
    );

    expect(resource).toMatchObject({
      id: "cet4-paper-2024-12-a",
      hostMode: "owned",
      downloadPolicy: "signed",
    });
    expect(await jsonResourceRepository.list({ level: "cet4" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cet4-paper-2024-12-a",
        }),
      ]),
    );
  });
});
