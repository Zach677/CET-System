import { Link } from "react-router";

import { LocalSummary } from "~/components/local-summary";
import { ResourceCard } from "~/components/resource-card";
import { SiteShell } from "~/components/site-shell";
import { buttonClassName } from "~/components/ui/button-styles";
import { getHomeOverview } from "~/server/content.server";

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
      title="极简一点，但真能用。"
      description="先从四级或六级进入，再进真题、模拟、专项、听力和资源。站内托管只放可控内容，高风险平台资源只做说明和跳转。"
      eyebrow="CET 备考工作台"
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

          <section className="glass-card research-note">
            <div className="section-kicker">资源边界</div>
            <h2>不是所有“网上很多”的内容都能随便搬。</h2>
            <p>
              真题、模拟卷、听力材料在网上分布很广，但系统化题库和平台资源很多都更接近出版社或机构的专有产品。所以 v1 只把站内可控内容做好，平台型资源保留来源说明和跳转。
            </p>
          </section>
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
