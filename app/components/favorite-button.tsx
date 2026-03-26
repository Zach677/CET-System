import { useEffect, useState } from "react";

import { createLocalFirstStore } from "~/lib/local-first";

const store = createLocalFirstStore();

export function FavoriteButton({
  resourceId,
  compact = false,
}: {
  resourceId: string;
  compact?: boolean;
}) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    let cancelled = false;

    store.listFavorites().then((favorites) => {
      if (!cancelled) {
        setFavorite(favorites.includes(resourceId));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  async function toggle() {
    await store.toggleFavorite(resourceId);
    const favorites = await store.listFavorites();
    setFavorite(favorites.includes(resourceId));
  }

  return (
    <button
      type="button"
      className={`favorite-button ${compact ? "is-compact" : ""}`}
      aria-pressed={favorite}
      onClick={toggle}
    >
      <span>{favorite ? "★" : "☆"}</span>
      {!compact && <span>{favorite ? "已收藏" : "收藏"}</span>}
    </button>
  );
}
