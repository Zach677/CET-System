import { describe, expect, it } from "vitest";

import {
  decideResourceDownload,
  getOwnedResourceFile,
} from "~/server/download-service.server";
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
