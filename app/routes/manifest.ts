import { webAppManifest } from "~/lib/web-app-manifest";

export function loader() {
  return Response.json(webAppManifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}
