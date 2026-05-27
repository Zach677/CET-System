import type { ApiErrorCode } from "~/server/api-error.server";

export type DownloadRateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export type DownloadRateLimitFailure = {
  ok: false;
  status: 429 | 503;
  headers: HeadersInit;
  error: {
    code: Extract<
      ApiErrorCode,
      "download_rate_limited" | "download_budget_limited"
    >;
    message: string;
  };
};

export type DownloadRateLimitResult =
  | { ok: true }
  | DownloadRateLimitFailure;

type EnforceDownloadRateLimitInput = {
  request: Request;
  limiter?: DownloadRateLimiter | null;
  enabled?: boolean;
  retryAfterSeconds?: number;
};

export function parseRateLimitEnabled(
  value: string | null | undefined,
): boolean {
  return value !== "false";
}

export function parseRetryAfterSeconds(
  value: string | null | undefined,
  fallbackSeconds = 60,
): number {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 3600) {
    return fallbackSeconds;
  }

  return parsed;
}

function firstForwardedFor(value: string | null): string | null {
  return value?.split(",").at(0)?.trim() || null;
}

function normalizeActorKey(value: string): string {
  return value
    .slice(0, 128)
    .replace(/[^A-Za-z0-9.:-]/g, "_");
}

export function getDownloadActorKey(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  const forwardedIp = firstForwardedFor(request.headers.get("x-forwarded-for"));
  const actor = cloudflareIp || forwardedIp || "local-dev";

  return normalizeActorKey(actor);
}

export async function enforceDownloadRateLimit({
  request,
  limiter,
  enabled = true,
  retryAfterSeconds = 60,
}: EnforceDownloadRateLimitInput): Promise<DownloadRateLimitResult> {
  if (!enabled) {
    return { ok: true };
  }

  if (!limiter) {
    return {
      ok: false,
      status: 503,
      headers: {
        "retry-after": String(retryAfterSeconds),
      },
      error: {
        code: "download_budget_limited",
        message: "下载保护暂时不可用，请稍后再试。",
      },
    };
  }

  const actorKey = getDownloadActorKey(request);
  let outcome: { success: boolean };

  try {
    outcome = await limiter.limit({ key: `download:${actorKey}` });
  } catch {
    return {
      ok: false,
      status: 503,
      headers: {
        "retry-after": String(retryAfterSeconds),
      },
      error: {
        code: "download_budget_limited",
        message: "下载保护暂时不可用，请稍后再试。",
      },
    };
  }

  if (outcome.success) {
    return { ok: true };
  }

  return {
    ok: false,
    status: 429,
    headers: {
      "retry-after": String(retryAfterSeconds),
    },
    error: {
      code: "download_rate_limited",
      message: "请求太频繁，请稍后再试。",
    },
  };
}
