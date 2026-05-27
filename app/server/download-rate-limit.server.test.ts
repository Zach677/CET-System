import { describe, expect, it, vi } from "vitest";

import {
  enforceDownloadRateLimit,
  getDownloadActorKey,
  parseRateLimitEnabled,
  parseRetryAfterSeconds,
  type DownloadRateLimiter,
} from "~/server/download-rate-limit.server";

describe("download rate limit", () => {
  it("normalizes configuration values", () => {
    expect(parseRateLimitEnabled("false")).toBe(false);
    expect(parseRateLimitEnabled("true")).toBe(true);
    expect(parseRateLimitEnabled(undefined)).toBe(true);

    expect(parseRetryAfterSeconds("30")).toBe(30);
    expect(parseRetryAfterSeconds("0")).toBe(60);
    expect(parseRetryAfterSeconds("7200")).toBe(60);
    expect(parseRetryAfterSeconds("bad", 10)).toBe(10);
  });

  it("uses Cloudflare connecting IP before forwarded headers", () => {
    const request = new Request("https://cet.example/download", {
      headers: {
        "cf-connecting-ip": "203.0.113.10",
        "x-forwarded-for": "198.51.100.4, 198.51.100.5",
      },
    });

    expect(getDownloadActorKey(request)).toBe("203.0.113.10");
  });

  it("falls back to forwarded headers in local development", () => {
    const request = new Request("https://cet.example/download", {
      headers: {
        "x-forwarded-for": "198.51.100.4, 198.51.100.5",
      },
    });

    expect(getDownloadActorKey(request)).toBe("198.51.100.4");
  });

  it("allows requests when the limiter is explicitly disabled", async () => {
    const request = new Request("https://cet.example/download");

    await expect(
      enforceDownloadRateLimit({ request, enabled: false }),
    ).resolves.toEqual({ ok: true });
  });

  it("fails closed when rate limiting is enabled but unavailable", async () => {
    const request = new Request("https://cet.example/download");

    await expect(enforceDownloadRateLimit({ request })).resolves.toEqual({
      ok: false,
      status: 503,
      headers: {
        "retry-after": "60",
      },
      error: {
        code: "download_budget_limited",
        message: "下载保护暂时不可用，请稍后再试。",
      },
    });
  });

  it("returns retry metadata when the Cloudflare limiter rejects", async () => {
    const limit = vi.fn().mockResolvedValue({ success: false });
    const limiter: DownloadRateLimiter = { limit };
    const request = new Request("https://cet.example/download", {
      headers: {
        "cf-connecting-ip": "203.0.113.10",
      },
    });

    await expect(
      enforceDownloadRateLimit({
        request,
        limiter,
        retryAfterSeconds: 20,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 429,
      headers: {
        "retry-after": "20",
      },
      error: {
        code: "download_rate_limited",
        message: "请求太频繁，请稍后再试。",
      },
    });

    expect(limit).toHaveBeenCalledWith({
      key: "download:203.0.113.10",
    });
  });

  it("fails closed when the Cloudflare limiter throws", async () => {
    const limiter: DownloadRateLimiter = {
      limit: vi.fn().mockRejectedValue(new Error("limiter unavailable")),
    };
    const request = new Request("https://cet.example/download");

    await expect(
      enforceDownloadRateLimit({ request, limiter }),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      error: {
        code: "download_budget_limited",
      },
    });
  });
});
