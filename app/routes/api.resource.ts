import { jsonError } from "~/server/api-error.server";
import { getResourceDetail } from "~/server/resource-service.server";

import type { Route } from "./+types/api.resource";

export async function loader({ params }: Route.LoaderArgs) {
  const detail = await getResourceDetail(params.resourceId);
  if (!detail) {
    return jsonError("resource_not_found", "资源不存在", 404);
  }

  return Response.json(detail, {
    headers: {
      "cache-control": "public, max-age=60",
    },
  });
}
