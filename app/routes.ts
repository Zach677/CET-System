import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("manifest.webmanifest", "routes/manifest.ts"),
  route("resources/:resourceId", "routes/resource-detail.tsx"),
  route("api/resources", "routes/api.resources.ts"),
  route("api/resources/:resourceId", "routes/api.resource.ts"),
  route("api/resources/:resourceId/download", "routes/api.resource-download.ts"),
  route("api/resources/:resourceId/file", "routes/api.resource-file.ts"),
  route("api/search", "routes/api.search.ts"),
  route(":level", "routes/level-home.tsx"),
  route(":level/:type", "routes/resource-list.tsx"),
] satisfies RouteConfig;
