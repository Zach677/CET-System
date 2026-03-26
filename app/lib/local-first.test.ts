import { beforeEach, describe, expect, it } from "vitest";

import { createLocalFirstStore } from "~/lib/local-first";

describe("local-first store", () => {
  beforeEach(async () => {
    await indexedDB.deleteDatabase("cet-workbench");
  });

  it("toggles favorites and keeps them persisted", async () => {
    const store = createLocalFirstStore();
    await store.toggleFavorite("cet4-paper-2024-12-a");
    expect(await store.listFavorites()).toEqual(["cet4-paper-2024-12-a"]);

    const nextStore = createLocalFirstStore();
    expect(await nextStore.listFavorites()).toEqual(["cet4-paper-2024-12-a"]);

    await nextStore.toggleFavorite("cet4-paper-2024-12-a");
    expect(await nextStore.listFavorites()).toEqual([]);
  });

  it("records recent study activity and cache picks", async () => {
    const store = createLocalFirstStore();

    await store.recordStudy({
      resourceId: "cet4-paper-2024-12-a",
      durationMinutes: 32,
      note: "先做听力再回看阅读",
      bucket: "papers",
    });
    await store.markCached("cet4-paper-2024-12-a", "试卷 PDF");

    const snapshot = await store.getSnapshot();
    expect(snapshot.recentStudy[0]?.resourceId).toBe("cet4-paper-2024-12-a");
    expect(snapshot.cachedResources).toContain("cet4-paper-2024-12-a::试卷 PDF");
  });
});
