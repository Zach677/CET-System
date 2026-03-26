import { useState } from "react";

import { createLocalFirstStore } from "~/lib/local-first";
import type { ResourceRecord } from "~/lib/resources";

const store = createLocalFirstStore();

type DownloadState =
  | { kind: "idle" }
  | { kind: "loading"; fileLabel: string }
  | { kind: "error"; message: string };

export function DownloadPanel({ resource }: { resource: ResourceRecord }) {
  const [state, setState] = useState<DownloadState>({ kind: "idle" });

  async function handleDownload(filePath: string, fileLabel: string, cacheable: boolean) {
    setState({ kind: "loading", fileLabel });

    const response = await fetch(`/api/resources/${resource.id}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setState({
        kind: "error",
        message: payload?.message ?? "下载入口暂时没拿到。",
      });
      return;
    }

    const payload = (await response.json()) as { url: string };
    if (cacheable) {
      await store.markCached(resource.id, fileLabel);
    }
    window.location.assign(payload.url);
    setState({ kind: "idle" });
  }

  async function markStudy() {
    await store.recordStudy({
      resourceId: resource.id,
      durationMinutes: resource.type === "listening" ? 20 : 30,
      bucket: resource.type,
      note: "从资源详情页手动记录",
    });
    setState({ kind: "idle" });
  }

  if (resource.hostMode === "restricted" || resource.downloadPolicy === "none") {
    return (
      <section className="glass-card action-panel">
        <div className="section-kicker">来源限制</div>
        <h3>这类资源不站内托管</h3>
        <p>{resource.summary}</p>
        {resource.externalUrl ? (
          <a className="button primary" href={resource.externalUrl} target="_blank" rel="noreferrer">
            前往原始来源
          </a>
        ) : (
          <button className="button" type="button" disabled>
            当前无可用下载
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="glass-card action-panel">
      <div className="section-kicker">下载与记录</div>
      <h3>站内可控下载</h3>
      <div className="action-stack">
        {resource.files.map((file) => (
          <button
            key={file.path}
            className="button primary"
            type="button"
            onClick={() => handleDownload(file.path, file.label, file.cacheable)}
            disabled={state.kind === "loading"}
          >
            {state.kind === "loading" && state.fileLabel === file.label
              ? `准备 ${file.label}…`
              : `下载 ${file.label}`}
          </button>
        ))}
        <button className="button" type="button" onClick={markStudy}>
          记一笔学习记录
        </button>
      </div>
      {state.kind === "error" && <p className="error-text">{state.message}</p>}
      <p className="meta-line">
        文件从 Worker 网关读取，不直接暴露 R2 桶权限。
      </p>
    </section>
  );
}
