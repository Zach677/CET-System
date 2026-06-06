import { useEffect, useState } from "react";
import { Form, Link } from "react-router";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";

import { ResourceCard } from "~/components/resource-card";
import { SiteShell } from "~/components/site-shell";
import { Button } from "~/components/ui/button";
import { normalizeResourceQuery } from "~/lib/resource-query";
import { examLevelSchema, typeFromSlug, typeLabel } from "~/lib/resources";
import { listResourceSummaries } from "~/server/resource-service.server";

import type { Route } from "./+types/resource-list";

export async function loader({ params, request }: Route.LoaderArgs) {
  const level = examLevelSchema.parse(params.level);
  const type = typeFromSlug(params.type);
  const url = new URL(request.url);
  const q = normalizeResourceQuery(url.searchParams.get("q")) ?? "";

  const items = await listResourceSummaries({
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
  const [query, setQuery] = useState(loaderData.q);

  useEffect(() => {
    setQuery(loaderData.q);
  }, [loaderData.q]);

  const search = (
    <Form className="toolbar-search" role="search">
      <Field.Root name="q">
        <Field.Label>搜标题、摘要或标签</Field.Label>
        <div className="search-row">
          <Input
            id="q"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={`搜 ${typeLabel[loaderData.type]}…`}
            className="search-input"
          />
          <Button variant="primary" type="submit">
            搜索
          </Button>
        </div>
      </Field.Root>
    </Form>
  );

  return (
    <SiteShell
      title={typeLabel[loaderData.type]}
      eyebrow={loaderData.level.toUpperCase()}
      level={loaderData.level}
      actions={search}
    >
      <section className="stack">
        <p className="list-meta">{loaderData.items.length} 条结果</p>

        {loaderData.items.length > 0 ? (
          <div className="resource-list">
            {loaderData.items.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} variant="list" />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>没有匹配资源</h3>
            <p>换一个关键词，或回到当前分类先扫完整列表。</p>
            {loaderData.q ? (
              <Link className="button" to={`/${loaderData.level}/${loaderData.type}`}>
                清除搜索
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
