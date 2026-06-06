import { Form, useActionData } from "react-router";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";

import { SiteShell } from "~/components/site-shell";
import { Button } from "~/components/ui/button";
import { levelLabel, typeLabel } from "~/lib/resources";
import {
  createImportDraft,
  getImportWorkbench,
  type ImportDraftResult,
  type ImportLaneView,
  type ImportStepView,
} from "~/server/import-service.server";

import type { Route } from "./+types/import";

const laneStatusLabel: Record<ImportLaneView["status"], string> = {
  available: "可用",
  planned: "待接入",
};

const stepStatusLabel: Record<ImportStepView["status"], string> = {
  available: "当前切片",
  planned: "后续接入",
};

const statusBadgeClass: Record<ImportLaneView["status"], string> = {
  available: "badge badge--accent",
  planned: "badge badge--muted",
};

function firstError(
  actionData: ImportDraftResult | undefined,
  field: string,
): string | undefined {
  if (!actionData || actionData.ok) {
    return undefined;
  }

  return actionData.fieldErrors[field]?.[0];
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "导入资源 · CET 备考工作台" },
    {
      name: "description",
      content: "为外部合法来源生成待审核资源草稿，后续接入 Neon 与 R2。",
    },
  ];
}

export async function loader() {
  return getImportWorkbench();
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  return createImportDraft(formData);
}

export default function ImportRoute({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const draft = actionData?.ok ? actionData.draft : null;
  const formKey = draft
    ? [
        draft.title,
        draft.sourceUrl,
        draft.sourceName,
        draft.level,
        draft.type,
        draft.summary,
      ].join("|")
    : "new-draft";

  return (
    <SiteShell
      title="导入资源"
      description="把外部合法来源收敛成可审核草稿，暂不写入 Neon 和 R2。"
      eyebrow="资源导入"
    >
      <section className="content-layout">
        <div className="stack">
          <section className="glass-card import-steps">
            <div className="section-kicker">导入闭环</div>
            <ol>
              {loaderData.steps.map((step) => (
                <li key={step.id}>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                  <span className={statusBadgeClass[step.status]}>
                    {stepStatusLabel[step.status]}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <Form key={formKey} method="post" className="glass-card import-form">
            <div className="section-header">
              <div>
                <div className="section-kicker">草稿生成</div>
                <h2>外部来源元数据</h2>
              </div>
            </div>

            <div className="form-grid">
              <Field.Root name="title" className="field-stack">
                <Field.Label>资源标题</Field.Label>
                <Input
                  name="title"
                  className="form-input"
                  defaultValue={draft?.title ?? ""}
                  placeholder="例如：2025 年 6 月四级听力来源说明"
                  aria-invalid={firstError(actionData, "title") ? true : undefined}
                />
                {firstError(actionData, "title") ? (
                  <Field.Error className="error-text">
                    {firstError(actionData, "title")}
                  </Field.Error>
                ) : null}
              </Field.Root>

              <Field.Root name="sourceUrl" className="field-stack">
                <Field.Label>来源 URL</Field.Label>
                <Input
                  name="sourceUrl"
                  type="url"
                  className="form-input"
                  defaultValue={draft?.sourceUrl ?? ""}
                  placeholder="https://example.com/source"
                  aria-invalid={
                    firstError(actionData, "sourceUrl") ? true : undefined
                  }
                />
                {firstError(actionData, "sourceUrl") ? (
                  <Field.Error className="error-text">
                    {firstError(actionData, "sourceUrl")}
                  </Field.Error>
                ) : null}
              </Field.Root>

              <Field.Root name="sourceName" className="field-stack">
                <Field.Label>来源名称</Field.Label>
                <Input
                  name="sourceName"
                  className="form-input"
                  defaultValue={draft?.sourceName ?? ""}
                  placeholder="留空时使用域名"
                />
              </Field.Root>

              <label className="field-stack">
                级别
                <select
                  className="form-input"
                  name="level"
                  defaultValue={draft?.level ?? "cet4"}
                >
                  {Object.entries(levelLabel).map(([level, label]) => (
                    <option key={level} value={level}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-stack">
                分类
                <select
                  className="form-input"
                  name="type"
                  defaultValue={draft?.type ?? "resources"}
                >
                  {Object.entries(typeLabel).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-stack field-stack--wide" htmlFor="summary">
                摘要
                <textarea
                  id="summary"
                  name="summary"
                  className="form-input form-textarea"
                  defaultValue={draft?.summary ?? ""}
                  placeholder="写清楚来源边界、适合的学习场景、是否只保留跳转。"
                  rows={4}
                />
              </label>
            </div>

            <Button variant="primary" type="submit">
              生成草稿
            </Button>
          </Form>

          {draft ? (
            <section className="glass-card draft-preview" aria-live="polite">
              <div className="section-header">
                <div>
                  <div className="section-kicker">待审核草稿</div>
                  <h2>{draft.title}</h2>
                </div>
                <span className="badge subtle">未持久化</span>
              </div>

              <p>{draft.summary}</p>

              <div className="detail-meta-grid">
                <div>
                  <span>级别</span>
                  <strong>{draft.levelLabel}</strong>
                </div>
                <div>
                  <span>分类</span>
                  <strong>{draft.typeLabel}</strong>
                </div>
                <div>
                  <span>托管</span>
                  <strong>外部来源</strong>
                </div>
                <div>
                  <span>下载</span>
                  <strong>外部跳转</strong>
                </div>
              </div>

              <a className="text-link" href={draft.sourceUrl}>
                {draft.sourceName}
              </a>

              <button className="button" type="button" disabled>
                确认入库待接入
              </button>
            </section>
          ) : null}
        </div>

        <aside className="sidebar-stack">
          <section className="glass-card lane-panel">
            <div className="section-kicker">导入通道</div>
            <div className="lane-list">
              {loaderData.lanes.map((lane) => (
                <article key={lane.id} className="lane-item">
                  <div>
                    <h3>{lane.title}</h3>
                    <p>{lane.description}</p>
                  </div>
                  <span className={statusBadgeClass[lane.status]}>
                    {laneStatusLabel[lane.status]}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-card import-notes">
            <div className="section-kicker">边界</div>
            <ul>
              {loaderData.guardrails.map((guardrail) => (
                <li key={guardrail}>{guardrail}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </SiteShell>
  );
}
