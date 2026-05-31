import { describe, expect, it } from "vitest";

import { readDownloadRequestBody } from "~/server/download-request.server";

describe("download request body", () => {
  it("reads a small JSON request body with a file id", async () => {
    const request = new Request("https://cet.example/download", {
      method: "POST",
      body: JSON.stringify({ fileId: "paper-pdf" }),
    });

    await expect(readDownloadRequestBody(request)).resolves.toEqual({
      ok: true,
      fileId: "paper-pdf",
    });
  });

  it("keeps file path as a compatibility fallback", async () => {
    const request = new Request("https://cet.example/download", {
      method: "POST",
      body: JSON.stringify({ filePath: "papers/owned-paper.pdf" }),
    });

    await expect(readDownloadRequestBody(request)).resolves.toEqual({
      ok: true,
      fileId: undefined,
      filePath: "papers/owned-paper.pdf",
    });
  });

  it("allows an empty body so the service can return file_not_found", async () => {
    const request = new Request("https://cet.example/download", {
      method: "POST",
    });

    await expect(readDownloadRequestBody(request)).resolves.toEqual({
      ok: true,
    });
  });

  it("rejects invalid JSON and invalid file reference types", async () => {
    await expect(
      readDownloadRequestBody(
        new Request("https://cet.example/download", {
          method: "POST",
          body: "{",
        }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 400,
      error: {
        code: "invalid_request",
      },
    });

    await expect(
      readDownloadRequestBody(
        new Request("https://cet.example/download", {
          method: "POST",
          body: JSON.stringify({ filePath: 123 }),
        }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 400,
      error: {
        code: "invalid_request",
      },
    });

    await expect(
      readDownloadRequestBody(
        new Request("https://cet.example/download", {
          method: "POST",
          body: JSON.stringify({ fileId: 123 }),
        }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 400,
      error: {
        code: "invalid_request",
      },
    });
  });

  it("rejects bodies beyond the configured byte limit", async () => {
    const request = new Request("https://cet.example/download", {
      method: "POST",
      body: JSON.stringify({ filePath: "papers/owned-paper.pdf" }),
    });

    await expect(readDownloadRequestBody(request, 8)).resolves.toEqual({
      ok: false,
      status: 400,
      error: {
        code: "invalid_request",
        message: "请求体过大",
      },
    });
  });

  it("rejects oversized content-length before reading the body", async () => {
    const request = new Request("https://cet.example/download", {
      method: "POST",
      headers: {
        "content-length": "2048",
      },
      body: "{}",
    });

    await expect(readDownloadRequestBody(request)).resolves.toEqual({
      ok: false,
      status: 400,
      error: {
        code: "invalid_request",
        message: "请求体过大",
      },
    });
  });
});
