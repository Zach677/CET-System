import { useEffect, useState } from "react";
import { Toggle } from "@base-ui/react/toggle";

import { createLocalFirstStore } from "~/lib/local-first";
import { classNames } from "~/lib/classnames";

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
    <Toggle
      pressed={favorite}
      className={classNames("favorite-button", compact && "is-compact")}
      aria-label={favorite ? "取消收藏" : "收藏"}
      onPressedChange={toggle}
    >
      <span>{favorite ? "★" : "☆"}</span>
      {!compact && <span>{favorite ? "已收藏" : "收藏"}</span>}
    </Toggle>
  );
}
