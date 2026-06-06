import { Link } from "react-router";

import { LocalSummary } from "~/components/local-summary";
import { ResourceCard } from "~/components/resource-card";
import { SiteShell } from "~/components/site-shell";
import { buttonClassName } from "~/components/ui/button-styles";
import { getHomeOverview } from "~/server/resource-service.server";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CET 备考工作台" },
    {
      name: "description",
      content: "iPad-first 的四六级备考工作台，含真题、模拟、专项、听力和资源索引。",
    },
  ];
}

export async function loader() {
  return getHomeOverview();
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <SiteShell
      title="CET 备考工作台"
      description="四六级真题、模拟、专项、听力和备考资源。"
    >
      <section className="card-grid card-grid--two">
        {loaderData.levels.map((level) => (
          <article key={level.level} className="glass-card level-card">
            <div className="section-kicker">{level.label}</div>
            <h2>{level.total} 份精选资源</h2>
            <div className="mini-stats">
              {level.buckets.map((bucket) => (
                <div key={bucket.type}>
                  <strong>{bucket.count}</strong>
                  <span>{bucket.label}</span>
                </div>
              ))}
            </div>
            <Link
              className={buttonClassName({ variant: "primary" })}
              to={`/${level.level}`}
            >
              进入 {level.label}
            </Link>
          </article>
        ))}
      </section>

      <section className="content-layout">
        <div className="stack">
          <section className="stack">
            <div className="section-header">
              <div>
                <div className="section-kicker">近期推荐</div>
                <h2>先从这些开始</h2>
              </div>
            </div>
            <div className="resource-grid">
              {loaderData.highlights.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </section>

          <p className="page-note">
            <span>资源边界</span>
            站内托管只放可控内容。真题、模拟卷、听力分布很广，但系统化题库多接近出版社或机构的专有产品，平台型资源只保留来源说明和跳转。
          </p>
        </div>

        <aside className="sidebar-stack">
          <LocalSummary />
          <section className="glass-card">
            <div className="section-kicker">快速入口</div>
            <h3>你大概会先点这些</h3>
            <div className="quick-links">
              <Link to="/cet4/papers">四级真题</Link>
              <Link to="/cet4/listening">四级听力</Link>
              <Link to="/cet6/papers">六级真题</Link>
              <Link to="/cet6/resources">六级写作资源</Link>
            </div>
          </section>
        </aside>
      </section>
    </SiteShell>
  );
}
