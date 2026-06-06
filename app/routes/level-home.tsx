import { Link } from "react-router";

import { SiteShell } from "~/components/site-shell";
import { buttonClassName } from "~/components/ui/button-styles";
import { examLevelSchema } from "~/lib/resources";
import { getLevelOverview } from "~/server/resource-service.server";

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
      title={`${loaderData.label}资源概览`}
      eyebrow={loaderData.label}
      level={loaderData.level}
    >
      <div className="card-grid card-grid--two">
        {loaderData.buckets.map((bucket) => (
          <article key={bucket.type} className="glass-card bucket-card">
            <div className="section-kicker">{bucket.label}</div>
            <h2>{bucket.count} 条</h2>
            <p>
              {bucket.latest[0]?.summary ??
                "这一栏还没加满，但结构已经给你留好了。"}
            </p>
            <Link
              className={buttonClassName({ variant: "primary" })}
              to={`/${loaderData.level}/${bucket.type}`}
            >
              看 {bucket.label}
            </Link>
          </article>
        ))}
      </div>
    </SiteShell>
  );
}
