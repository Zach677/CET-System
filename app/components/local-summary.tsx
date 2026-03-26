import { useEffect, useState } from "react";

import { createLocalFirstStore } from "~/lib/local-first";

const store = createLocalFirstStore();

type Snapshot = Awaited<ReturnType<ReturnType<typeof createLocalFirstStore>["getSnapshot"]>>;

export function LocalSummary() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    store.getSnapshot().then((nextSnapshot) => {
      if (!cancelled) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="glass-card local-summary">
      <div className="section-kicker">Local First</div>
      <h3>这台设备上的学习状态</h3>
      <div className="summary-grid">
        <div>
          <strong>{snapshot?.favorites.length ?? 0}</strong>
          <span>收藏</span>
        </div>
        <div>
          <strong>{snapshot?.recentStudy.length ?? 0}</strong>
          <span>最近学习</span>
        </div>
        <div>
          <strong>{snapshot?.cachedResources.length ?? 0}</strong>
          <span>已缓存</span>
        </div>
      </div>
      {snapshot?.recentStudy?.[0] ? (
        <p className="meta-line">
          最近一次：{snapshot.recentStudy[0].resourceId} ·{" "}
          {snapshot.recentStudy[0].durationMinutes} 分钟
        </p>
      ) : (
        <p className="meta-line">还没开始也没事，先点一份资源进去。</p>
      )}
    </section>
  );
}
