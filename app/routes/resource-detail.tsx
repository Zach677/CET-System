import { isRouteErrorResponse, Link } from "react-router";

import { DownloadPanel } from "~/components/download-panel";
import { FavoriteButton } from "~/components/favorite-button";
import { ResourceCard } from "~/components/resource-card";
import { SiteShell } from "~/components/site-shell";
import { buttonClassName } from "~/components/ui/button-styles";
import { levelLabel, typeLabel } from "~/lib/resources";
import {
  createDownloadDecision,
  getResourceById,
  listRelatedResources,
} from "~/server/content.server";

import type { Route } from "./+types/resource-detail";

export async function loader({ params }: Route.LoaderArgs) {
  const resource = await getResourceById(params.resourceId);
  if (!resource) {
    throw new Response("Not Found", { status: 404 });
  }

  const related = await listRelatedResources(resource);
  return {
    resource,
    related,
    decision: createDownloadDecision(resource),
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data?.resource.title ?? "资源详情"} · CET 备考工作台` },
    { name: "description", content: data?.resource.summary ?? "资源详情页" },
  ];
}

export default function ResourceDetail({ loaderData }: Route.ComponentProps) {
  const { resource, related } = loaderData;

  return (
    <SiteShell
      title={resource.title}
      description={resource.summary}
      eyebrow={`${levelLabel[resource.level]} · ${typeLabel[resource.type]}`}
      level={resource.level}
    >
      <section className="content-layout">
        <div className="stack">
          <article className="glass-card detail-card">
            <div className="detail-card__top">
              <div className="badge-row">
                <span className="badge">{resource.source}</span>
                <span className="badge subtle">{resource.licenseStatus}</span>
                <span className="badge subtle">{resource.hostMode}</span>
              </div>
              <FavoriteButton resourceId={resource.id} />
            </div>

            <div className="meta-row">
              <span>{resource.year}</span>
              <span>{resource.tags.join(" · ")}</span>
            </div>

            <ul className="file-list">
              {resource.files.map((file) => (
                <li key={file.path}>
                  <strong>{file.label}</strong>
                  <span>
                    {file.kind.toUpperCase()} · {file.cacheable ? "可手动缓存" : "仅在线播放"}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          {related.length > 0 ? (
            <section className="stack">
              <div className="section-header">
                <div>
                  <div className="section-kicker">相关资源</div>
                  <h2>顺手看这几个</h2>
                </div>
              </div>
              <div className="resource-grid">
                {related.map((item) => (
                  <ResourceCard key={item.id} resource={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="sidebar-stack">
          <DownloadPanel resource={resource} />
          <section className="glass-card">
            <div className="section-kicker">返回</div>
            <h3>继续刷同类</h3>
            <Link className={buttonClassName()} to={`/${resource.level}/${resource.type}`}>
              回到 {typeLabel[resource.type]}
            </Link>
          </section>
        </aside>
      </section>
    </SiteShell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <SiteShell
        title="资源没找到"
        description="要么链接过期了，要么这条资源还没进库。"
        eyebrow="404"
      >
        <section className="glass-card">
          <Link className={buttonClassName({ variant: "primary" })} to="/">
            回首页
          </Link>
        </section>
      </SiteShell>
    );
  }

  throw error;
}
