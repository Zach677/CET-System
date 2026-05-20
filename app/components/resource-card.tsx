import { Link } from "react-router";

import { FavoriteButton } from "~/components/favorite-button";
import { classNames } from "~/lib/classnames";
import { levelLabel, typeLabel, type ResourceRecord } from "~/lib/resources";

export function ResourceCard({
  resource,
  variant = "card",
}: {
  resource: ResourceRecord;
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
          <span className="badge">{levelLabel[resource.level]}</span>
          <span className="badge">{typeLabel[resource.type]}</span>
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
          <span>{resource.tags.join(" · ")}</span>
        </div>
        <Link className="text-link" to={`/resources/${resource.id}`}>
          看详情
        </Link>
      </div>
    </article>
  );
}
