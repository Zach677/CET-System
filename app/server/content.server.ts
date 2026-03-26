import cet4ResourcesJson from "../../content/cet4/resources.json";
import cet6ResourcesJson from "../../content/cet6/resources.json";

import {
  levelLabel,
  resourceCollectionSchema,
  typeLabel,
  type ExamLevel,
  type ResourceRecord,
  type ResourceType,
} from "~/lib/resources";

type ResourceFilters = {
  level?: ExamLevel;
  type?: ResourceType;
  query?: string;
};

export type DownloadDecision =
  | { kind: "signed"; enabled: true; label: string }
  | { kind: "external"; enabled: false; label: string }
  | { kind: "none"; enabled: false; label: string };

const resources = resourceCollectionSchema
  .parse([...cet4ResourcesJson, ...cet6ResourcesJson])
  .sort(
    (left, right) =>
      right.year - left.year || left.title.localeCompare(right.title, "zh-CN"),
  );

export async function loadResources() {
  return resources;
}

export async function listResources(filters: ResourceFilters = {}) {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  return resources.filter((resource) => {
    if (filters.level && resource.level !== filters.level) {
      return false;
    }

    if (filters.type && resource.type !== filters.type) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [resource.title, resource.summary, resource.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

export async function getResourceById(resourceId: string) {
  return resources.find((resource) => resource.id === resourceId) ?? null;
}

export function createDownloadDecision(resource: ResourceRecord): DownloadDecision {
  if (
    resource.downloadPolicy === "signed" &&
    resource.hostMode === "owned" &&
    resource.files.length > 0
  ) {
    return { kind: "signed", enabled: true, label: "下载可用资源" };
  }

  if (resource.externalUrl) {
    return { kind: "external", enabled: false, label: "前往原始来源" };
  }

  return { kind: "none", enabled: false, label: "当前不可下载" };
}

export async function getLevelOverview(level: ExamLevel) {
  const levelResources = await listResources({ level });

  const buckets = Object.entries(typeLabel).map(([type, label]) => {
    const matches = levelResources.filter((resource) => resource.type === type);
    return {
      type: type as ResourceType,
      label,
      count: matches.length,
      latest: matches.slice(0, 2),
    };
  });

  return {
    level,
    label: levelLabel[level],
    total: levelResources.length,
    buckets,
  };
}

export async function getHomeOverview() {
  const [cet4, cet6] = await Promise.all([
    getLevelOverview("cet4"),
    getLevelOverview("cet6"),
  ]);

  return {
    levels: [cet4, cet6],
    highlights: resources.slice(0, 5),
  };
}

export async function listRelatedResources(resource: ResourceRecord, limit = 3) {
  return resources
    .filter(
      (entry) =>
        entry.id !== resource.id &&
        entry.level === resource.level &&
        entry.type !== resource.type,
    )
    .slice(0, limit);
}
