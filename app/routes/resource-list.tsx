import { Form } from "react-router";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";

import { ResourceCard } from "~/components/resource-card";
import { SiteShell } from "~/components/site-shell";
import { Button } from "~/components/ui/button";
import { examLevelSchema, typeFromSlug, typeLabel } from "~/lib/resources";
import { listResources } from "~/server/content.server";

import type { Route } from "./+types/resource-list";

export async function loader({ params, request }: Route.LoaderArgs) {
  const level = examLevelSchema.parse(params.level);
  const type = typeFromSlug(params.type);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const items = await listResources({
    level,
    type,
    query: q,
  });

  return {
    items,
    level,
    type,
    q,
  };
}

export function meta({ data }: Route.MetaArgs) {
  const type = data?.type ?? "papers";
  return [
    {
      title: `${typeLabel[type]} · ${data?.level?.toUpperCase?.() ?? "CET"}`,
    },
    { name: "description", content: `${typeLabel[type]} 列表与搜索。` },
  ];
}

export default function ResourceList({ loaderData }: Route.ComponentProps) {
  return (
    <SiteShell
      title={typeLabel[loaderData.type]}
      description="下载只放在详情页。这里先筛选、先判断来源，再决定要不要点进去。"
      eyebrow={loaderData.level.toUpperCase()}
      level={loaderData.level}
    >
      <section className="stack">
        <Form className="glass-card search-panel" role="search">
          <Field.Root name="q">
            <Field.Label>搜标题、摘要或标签</Field.Label>
            <div className="search-row">
              <Input
                id="q"
                name="q"
                type="search"
                defaultValue={loaderData.q}
                placeholder={`搜 ${typeLabel[loaderData.type]}…`}
                className="search-input"
              />
              <Button variant="primary" type="submit">
                搜索
              </Button>
            </div>
          </Field.Root>
        </Form>

        <div className="section-header">
          <div>
            <div className="section-kicker">列表</div>
            <h2>{loaderData.items.length} 条结果</h2>
          </div>
        </div>

        <div className="resource-grid">
          {loaderData.items.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
