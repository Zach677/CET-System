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
