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

const hostModeLabel = {
  owned: "站内托管",
  restricted: "来源受限",
  external: "外部来源",
} as const;

const licenseStatusLabel = {
  owned: "可控授权",
  restricted: "受限资源",
  external: "外部授权",
} as const;

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
  const { decision, resource, related } = loaderData;

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
            <div className="detail-card__header">
              <div className="detail-card__title-block">
                <div className="section-kicker">资源状态</div>
                <h2>{decision.label}</h2>
              </div>
              <FavoriteButton resourceId={resource.id} />
            </div>

            <div className="detail-meta-grid" aria-label="资源元信息">
              <div>
                <span>来源</span>
                <strong>{resource.source}</strong>
              </div>
              <div>
                <span>年份</span>
                <strong>{resource.year}</strong>
              </div>
              <div>
                <span>托管</span>
                <strong>{hostModeLabel[resource.hostMode]}</strong>
              </div>
              <div>
                <span>授权</span>
                <strong>{licenseStatusLabel[resource.licenseStatus]}</strong>
              </div>
            </div>

            <div className="meta-row detail-tags">
              <span>{resource.tags.join(" · ")}</span>
            </div>

            <div className="section-kicker">文件清单</div>
            <ul className="file-list">
              {resource.files.map((file) => (
                <li key={file.path}>
                  <div>
                    <strong>{file.label}</strong>
                    <span>{file.kind.toUpperCase()}</span>
                  </div>
                  <span>{file.cacheable ? "可手动缓存" : "仅在线播放"}</span>
                </li>
              ))}
            </ul>
          </article>
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

      {related.length > 0 ? (
        <section className="stack related-resources">
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
