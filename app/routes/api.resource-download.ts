import { getResourceById } from "~/server/content.server";

import type { Route } from "./+types/api.resource-download";

export async function action({ request, params, context }: Route.ActionArgs) {
  const resource = await getResourceById(params.resourceId);
  if (!resource) {
    return Response.json({ message: "资源不存在" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { filePath?: string }
    | null;
  const filePath = body?.filePath;
  const file = resource.files.find((entry) => entry.path === filePath);

  if (!file) {
    return Response.json({ message: "文件不存在" }, { status: 404 });
  }

  if (resource.hostMode !== "owned") {
    return Response.json(
      { message: "该资源不支持站内下载" },
      { status: 400 },
    );
  }

  const publicBase = context.cloudflare.env.R2_PUBLIC_BASE_URL?.trim();
  if (publicBase) {
    return Response.json({
      url: `${publicBase.replace(/\/$/, "")}/${file.path}`,
    });
  }

  const url = new URL(request.url);
  url.pathname = `/api/resources/${resource.id}/file`;
  url.searchParams.set("path", file.path);
  return Response.json({ url: url.toString() });
}
