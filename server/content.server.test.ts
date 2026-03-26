import { describe, expect, it } from "vitest";

import {
  createDownloadDecision,
  getResourceById,
  listResources,
} from "~/server/content.server";

describe("content server", () => {
  it("filters resources by level and type", async () => {
    const listening = await listResources({ level: "cet4", type: "listening" });

    expect(listening).toHaveLength(1);
    expect(listening[0]?.id).toBe("cet4-listening-welearn");
  });

  it("returns full details for a resource", async () => {
    const resource = await getResourceById("cet6-writing-templates");

    expect(resource?.title).toBe("六级写作模板与高分表达");
    expect(resource?.files).toHaveLength(1);
  });

  it("allows signed downloads only for owned resources", async () => {
    const owned = await getResourceById("cet4-paper-2024-12-a");
    const restricted = await getResourceById("cet4-listening-welearn");

    expect(createDownloadDecision(owned!)).toMatchObject({
      kind: "signed",
      enabled: true,
    });
    expect(createDownloadDecision(restricted!)).toMatchObject({
      kind: "external",
      enabled: false,
    });
  });
});
