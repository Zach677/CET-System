import { jsonError } from "~/server/api-error.server";
import { decideResourceDownload } from "~/server/download-service.server";

import type { Route } from "./+types/api.resource-download";

export async function action({ request, params, context }: Route.ActionArgs) {
  const body = (await request.json().catch(() => null)) as
    | { filePath?: string }
    | null;

  const decision = await decideResourceDownload({
    resourceId: params.resourceId,
    filePath: body?.filePath,
    requestUrl: request.url,
    publicBaseUrl: context.cloudflare.env.R2_PUBLIC_BASE_URL,
  });

  if (!decision.ok) {
    return jsonError(
      decision.error.code,
      decision.error.message,
      decision.status,
    );
  }

  return Response.json(decision.payload, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
