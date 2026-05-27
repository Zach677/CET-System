import { jsonError } from "~/server/api-error.server";
import { getOwnedResourceFile } from "~/server/download-service.server";

import type { Route } from "./+types/api.resource-file";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const result = await getOwnedResourceFile({
    resourceId: params.resourceId,
    filePath: path,
  });

  if (!result.ok) {
    return jsonError(result.error.code, result.error.message, result.status);
  }

  const object = await context.cloudflare.env.RESOURCE_BUCKET.get(
    result.file.path,
  );
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
