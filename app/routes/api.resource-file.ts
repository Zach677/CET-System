import { jsonError } from "~/server/api-error.server";
import {
  enforceDownloadRateLimit,
  parseRateLimitEnabled,
  parseRetryAfterSeconds,
} from "~/server/download-rate-limit.server";
import { getOwnedResourceFile } from "~/server/download-service.server";

import type { Route } from "./+types/api.resource-file";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const env = context.cloudflare.env;
  const result = await getOwnedResourceFile({
    resourceId: params.resourceId,
    filePath: path,
    budgetMode: env.DOWNLOAD_BUDGET_MODE,
  });

  if (!result.ok) {
    return jsonError(result.error.code, result.error.message, result.status);
  }

  const rateLimit = await enforceDownloadRateLimit({
    request,
    limiter: env.DOWNLOAD_RATE_LIMITER,
    enabled: parseRateLimitEnabled(env.DOWNLOAD_RATE_LIMIT_ENABLED),
    retryAfterSeconds: parseRetryAfterSeconds(
      env.DOWNLOAD_RATE_LIMIT_RETRY_AFTER_SECONDS,
    ),
  });

  if (!rateLimit.ok) {
    return jsonError(
      rateLimit.error.code,
      rateLimit.error.message,
      rateLimit.status,
      { headers: rateLimit.headers },
    );
  }

  const object = await env.RESOURCE_BUCKET.get(result.file.path);
  if (!object) {
    return jsonError("storage_object_missing", "文件暂时不可用", 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set(
    "content-disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(
      result.file.path.split("/").pop() ?? result.file.label,
    )}`,
  );

  return new Response(object.body, { headers });
}
