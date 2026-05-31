import { normalizeResourceQuery } from "~/lib/resource-query";
import { examLevelSchema, resourceTypeSchema } from "~/lib/resources";
import { listResourceSummaries } from "~/server/resource-service.server";

import type { Route } from "./+types/api.resources";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const levelResult = examLevelSchema.safeParse(url.searchParams.get("level"));
  const typeResult = resourceTypeSchema.safeParse(url.searchParams.get("type"));
  const level = levelResult.success ? levelResult.data : undefined;
  const type = typeResult.success ? typeResult.data : undefined;
  const q = normalizeResourceQuery(url.searchParams.get("q"));

  const items = await listResourceSummaries({
    level,
    type,
    query: q,
  });

  return Response.json(
    { items },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
}
