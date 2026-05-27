import { useState } from "react";

import { Button } from "~/components/ui/button";
import { buttonClassName } from "~/components/ui/button-styles";
import { createLocalFirstStore } from "~/lib/local-first";
import type { ResourceDownloadPanelView } from "~/lib/resource-view-models";

const store = createLocalFirstStore();

type DownloadState =
  | { kind: "idle" }
  | { kind: "loading"; fileLabel: string }
  | { kind: "error"; message: string };

export function DownloadPanel({
  download,
}: {
  download: ResourceDownloadPanelView;
}) {
  const [state, setState] = useState<DownloadState>({ kind: "idle" });

  if (download.mode === "external") {
    return (
      <section className="glass-card action-panel">
        <div className="section-kicker">来源限制</div>
        <h3>{download.title}</h3>
        <p>{download.description}</p>
        <a
          className={buttonClassName({ variant: "primary" })}
          href={download.externalUrl}
          target="_blank"
          rel="noreferrer"
        >
          前往原始来源
        </a>
      </section>
    );
  }

  if (download.mode === "unavailable") {
    return (
      <section className="glass-card action-panel">
        <div className="section-kicker">来源限制</div>
        <h3>{download.title}</h3>
        <p>{download.description}</p>
        <Button disabled>
          当前无可用下载
        </Button>
      </section>
    );
  }

  const ownedDownload = download;

  async function handleDownload(
    filePath: string,
    fileLabel: string,
    cacheable: boolean,
  ) {
    setState({ kind: "loading", fileLabel });

    const response = await fetch(
      `/api/resources/${ownedDownload.resourceId}/download`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setState({
        kind: "error",
        message: payload?.error?.message ?? "下载入口暂时没拿到。",
      });
      return;
    }

    const payload = (await response.json()) as { url: string };
    if (cacheable) {
      await store.markCached(ownedDownload.resourceId, fileLabel);
    }
    window.location.assign(payload.url);
    setState({ kind: "idle" });
  }

  async function markStudy() {
    await store.recordStudy({
      resourceId: ownedDownload.resourceId,
      durationMinutes: ownedDownload.resourceType === "listening" ? 20 : 30,
      bucket: ownedDownload.resourceType,
      note: "从资源详情页手动记录",
    });
    setState({ kind: "idle" });
  }

  return (
    <section className="glass-card action-panel download-panel">
      <div className="section-kicker">下载与记录</div>
      <h3>{ownedDownload.title}</h3>
      <div className="action-panel__summary" aria-label="下载概览">
        <div>
          <strong>{ownedDownload.fileCount}</strong>
          <span>文件</span>
        </div>
        <div>
          <strong>{ownedDownload.cacheableFileCount}</strong>
          <span>可缓存</span>
        </div>
      </div>
      <div className="action-stack">
        {ownedDownload.files.map((file) => (
          <Button
            key={file.path}
            variant="primary"
            onClick={() => handleDownload(file.path, file.label, file.cacheable)}
            disabled={state.kind === "loading"}
            focusableWhenDisabled
          >
            {state.kind === "loading" && state.fileLabel === file.label
              ? `准备 ${file.label}…`
              : `下载 ${file.label}`}
          </Button>
        ))}
        <Button onClick={markStudy}>
          记一笔学习记录
        </Button>
      </div>
      {state.kind === "error" && <p className="error-text">{state.message}</p>}
      <p className="meta-line">
        下载入口会先经过服务端策略检查。
      </p>
    </section>
  );
}
