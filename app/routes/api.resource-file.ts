import { getResourceById } from "~/server/content.server";

import type { Route } from "./+types/api.resource-file";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const resource = await getResourceById(params.resourceId);
  if (!resource) {
    return new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const file = resource.files.find((entry) => entry.path === path);

  if (!file || resource.hostMode !== "owned") {
    return new Response("Forbidden", { status: 403 });
  }

  const object = await context.cloudflare.env.RESOURCE_BUCKET.get(file.path);
  if (!object) {
    return new Response("Missing file", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set(
    "content-disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(file.path.split("/").pop() ?? file.label)}`,
  );

  return new Response(object.body, { headers });
}
