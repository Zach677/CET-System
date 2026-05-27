import { isRouteErrorResponse, Link } from "react-router";

import { DownloadPanel } from "~/components/download-panel";
import { FavoriteButton } from "~/components/favorite-button";
import { ResourceCard } from "~/components/resource-card";
import { SiteShell } from "~/components/site-shell";
import { buttonClassName } from "~/components/ui/button-styles";
import { getResourceDetail } from "~/server/resource-service.server";

import type { Route } from "./+types/resource-detail";

export async function loader({ params }: Route.LoaderArgs) {
  const detail = await getResourceDetail(params.resourceId);
  if (!detail) {
    throw new Response("Not Found", { status: 404 });
  }

  return { detail };
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data?.detail.title ?? "资源详情"} · CET 备考工作台` },
    { name: "description", content: data?.detail.summary ?? "资源详情页" },
  ];
}

export default function ResourceDetail({ loaderData }: Route.ComponentProps) {
  const { detail } = loaderData;

  return (
    <SiteShell
      title={detail.title}
      description={detail.summary}
      eyebrow={`${detail.levelLabel} · ${detail.typeLabel}`}
      level={detail.level}
    >
      <section className="content-layout">
        <div className="stack">
          <article className="glass-card detail-card">
            <div className="detail-card__header">
              <div className="detail-card__title-block">
                <div className="section-kicker">资源状态</div>
                <h2>{detail.download.title}</h2>
              </div>
              <FavoriteButton resourceId={detail.id} />
            </div>

            <div className="detail-meta-grid" aria-label="资源元信息">
              {detail.facts.map((fact) => (
                <div key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>

            <div className="meta-row detail-tags">
              <span>{detail.tagLine}</span>
            </div>

            <div className="section-kicker">文件清单</div>
            <ul className="file-list">
              {detail.files.map((file) => (
                <li key={file.path}>
                  <div>
                    <strong>{file.label}</strong>
                    <span>{file.kindLabel}</span>
                  </div>
                  <span>{file.cacheLabel}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <aside className="sidebar-stack">
          <DownloadPanel download={detail.download} />
          <section className="glass-card">
            <div className="section-kicker">返回</div>
            <h3>继续刷同类</h3>
            <Link className={buttonClassName()} to={`/${detail.level}/${detail.type}`}>
              回到 {detail.typeLabel}
            </Link>
          </section>
        </aside>
      </section>

      {detail.related.length > 0 ? (
        <section className="stack related-resources">
          <div className="section-header">
            <div>
              <div className="section-kicker">相关资源</div>
              <h2>顺手看这几个</h2>
            </div>
          </div>
          <div className="resource-grid">
            {detail.related.map((item) => (
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
