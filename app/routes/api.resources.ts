import { listResources } from "~/server/content.server";

import type { Route } from "./+types/api.resources";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const level = url.searchParams.get("level") ?? undefined;
  const type = url.searchParams.get("type") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;

  const resources = await listResources({
    level: level === "cet4" || level === "cet6" ? level : undefined,
    type:
      type &&
      ["papers", "mocks", "skills", "listening", "resources"].includes(type)
        ? (type as "papers" | "mocks" | "skills" | "listening" | "resources")
        : undefined,
    query: q,
  });

  return Response.json({ items: resources });
}
