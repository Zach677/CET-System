import { getResourceById } from "~/server/content.server";

import type { Route } from "./+types/api.resource";

export async function loader({ params }: Route.LoaderArgs) {
  const resource = await getResourceById(params.resourceId);
  if (!resource) {
    return Response.json({ message: "资源不存在" }, { status: 404 });
  }

  return Response.json(resource);
}
