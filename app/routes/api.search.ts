import { searchResourceSummaries } from "~/server/resource-service.server";

import type { Route } from "./+types/api.search";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  const items = await searchResourceSummaries(query);

  return Response.json(
    { items },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
}
