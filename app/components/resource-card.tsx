import { Link } from "react-router";

import { FavoriteButton } from "~/components/favorite-button";
import { classNames } from "~/lib/classnames";
import type { ResourceSummaryView } from "~/lib/resource-view-models";

export function ResourceCard({
  resource,
  variant = "card",
}: {
  resource: ResourceSummaryView;
  variant?: "card" | "list";
}) {
  return (
    <article
      className={classNames(
        "resource-card",
        variant === "list" && "resource-card--list",
      )}
    >
      <div className="resource-card__top">
        <div className="badge-row">
          <span className="badge">{resource.levelLabel}</span>
          <span className="badge">{resource.typeLabel}</span>
          <span className="badge subtle">{resource.source}</span>
        </div>
        <FavoriteButton resourceId={resource.id} compact />
      </div>
      <div className="resource-card__body">
        <h3>
          <Link to={`/resources/${resource.id}`}>{resource.title}</Link>
        </h3>
        <p>{resource.summary}</p>
      </div>
      <div className="resource-card__footer">
        <div className="meta-row">
          <span>{resource.year}</span>
          <span>{resource.tagLine}</span>
        </div>
        <Link className="text-link" to={`/resources/${resource.id}`}>
          看详情
        </Link>
      </div>
    </article>
  );
}
