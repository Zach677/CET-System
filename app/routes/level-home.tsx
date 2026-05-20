import { Link } from "react-router";

import { LocalSummary } from "~/components/local-summary";
import { SiteShell } from "~/components/site-shell";
import { buttonClassName } from "~/components/ui/button-styles";
import { examLevelSchema, typeLabel } from "~/lib/resources";
import { getLevelOverview } from "~/server/content.server";

import type { Route } from "./+types/level-home";

export async function loader({ params }: Route.LoaderArgs) {
  const level = examLevelSchema.parse(params.level);
  return getLevelOverview(level);
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data?.label ?? "备考舱"} · CET 备考工作台` },
    {
      name: "description",
      content: `${data?.label ?? "CET"} 下的真题、模拟、专项、听力和资源入口。`,
    },
  ];
}

export default function LevelHome({ loaderData }: Route.ComponentProps) {
  return (
    <SiteShell
      title={`${loaderData.label}备考舱`}
      description="这里不堆满一屏噪音。先看每个模块的量，再点进真正要学的那一类。"
      eyebrow={loaderData.label}
      level={loaderData.level}
    >
      <section className="content-layout">
        <div className="stack">
          <div className="card-grid card-grid--two">
            {loaderData.buckets.map((bucket) => (
              <article key={bucket.type} className="glass-card bucket-card">
                <div className="section-kicker">{typeLabel[bucket.type]}</div>
                <h2>{bucket.count} 条</h2>
                <p>
                  {bucket.latest[0]?.summary ??
                    "这一栏还没加满，但结构已经给你留好了。"}
                </p>
                <Link
                  className={buttonClassName({ variant: "primary" })}
                  to={`/${loaderData.level}/${bucket.type}`}
                >
                  看 {typeLabel[bucket.type]}
                </Link>
              </article>
            ))}
          </div>
        </div>

        <aside className="sidebar-stack">
          <LocalSummary />
        </aside>
      </section>
    </SiteShell>
  );
}
