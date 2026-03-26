import searchIndex from "../../content/generated/search-index.json";

import type { Route } from "./+types/api.search";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const items = query
    ? searchIndex.filter((entry) =>
        [entry.title, entry.summary, entry.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : searchIndex;

  return Response.json({ items });
}
