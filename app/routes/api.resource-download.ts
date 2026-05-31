import { jsonError } from "~/server/api-error.server";
import {
  enforceDownloadRateLimit,
  parseRateLimitEnabled,
  parseRetryAfterSeconds,
} from "~/server/download-rate-limit.server";
import { readDownloadRequestBody } from "~/server/download-request.server";
import { decideResourceDownload } from "~/server/download-service.server";

import type { Route } from "./+types/api.resource-download";

export async function action({ request, params, context }: Route.ActionArgs) {
  const body = await readDownloadRequestBody(request);

  if (!body.ok) {
    return jsonError(body.error.code, body.error.message, body.status);
  }

  const env = context.cloudflare.env;

  const decision = await decideResourceDownload({
    resourceId: params.resourceId,
    fileId: body.fileId,
    filePath: body.filePath,
    requestUrl: request.url,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    budgetMode: env.DOWNLOAD_BUDGET_MODE,
  });

  if (!decision.ok) {
    return jsonError(
      decision.error.code,
      decision.error.message,
      decision.status,
    );
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

  return Response.json(decision.payload, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
