import {
  fileKindLabel,
  hostModeLabel,
  licenseStatusLabel,
  type HomeOverviewView,
  type LevelOverviewView,
  type ResourceDetailView,
  type ResourceDownloadPanelView,
  type ResourceFileView,
  type ResourceSummaryView,
} from "~/lib/resource-view-models";
import {
  levelLabel,
  typeLabel,
  type ExamLevel,
  type ResourceFile,
  type ResourceRecord,
  type ResourceType,
} from "~/lib/resources";
import {
  jsonResourceRepository,
  type ResourceFilters,
  type ResourceRepository,
} from "~/server/resource-repository.server";

function countCacheableFiles(files: ResourceFile[]) {
  return files.filter((file) => file.cacheable).length;
}

function toTagLine(tags: string[]) {
  return tags.join(" · ");
}

function toResourceSummaryView(
  resource: ResourceRecord,
): ResourceSummaryView {
  return {
    id: resource.id,
    level: resource.level,
    levelLabel: levelLabel[resource.level],
    type: resource.type,
    typeLabel: typeLabel[resource.type],
    title: resource.title,
    summary: resource.summary,
    year: resource.year,
    source: resource.source,
    tags: resource.tags,
    tagLine: toTagLine(resource.tags),
    fileCount: resource.files.length,
    cacheableFileCount: countCacheableFiles(resource.files),
  };
}

function toResourceFileView(file: ResourceFile): ResourceFileView {
  return {
    label: file.label,
    kind: file.kind,
    kindLabel: fileKindLabel[file.kind],
    path: file.path,
    cacheable: file.cacheable,
    cacheLabel: file.cacheable ? "可手动缓存" : "需在线访问",
  };
}

function toResourceFacts(resource: ResourceRecord) {
  return [
    { label: "来源", value: resource.source },
    { label: "年份", value: String(resource.year) },
    { label: "托管", value: hostModeLabel[resource.hostMode] },
    { label: "授权", value: licenseStatusLabel[resource.licenseStatus] },
  ];
}

function toDownloadPanelView(
  resource: ResourceRecord,
  files: ResourceFileView[],
): ResourceDownloadPanelView {
  const fileCount = files.length;
  const cacheableFileCount = files.filter((file) => file.cacheable).length;

  if (
    resource.downloadPolicy === "signed" &&
    resource.hostMode === "owned" &&
    fileCount > 0
  ) {
    return {
      mode: "owned",
      title: "下载可用资源",
      description: resource.summary,
      resourceId: resource.id,
      resourceType: resource.type,
      files,
      fileCount,
      cacheableFileCount,
    };
  }

  if (resource.externalUrl) {
    return {
      mode: "external",
      title: "这类资源不站内托管",
      description: resource.summary,
      externalUrl: resource.externalUrl,
    };
  }

  return {
    mode: "unavailable",
    title: "当前不可下载",
    description: resource.summary,
  };
}

function toResourceDetailView(
  resource: ResourceRecord,
  related: ResourceSummaryView[],
): ResourceDetailView {
  const files = resource.files.map(toResourceFileView);

  return {
    ...toResourceSummaryView(resource),
    externalUrl: resource.externalUrl,
    hostMode: resource.hostMode,
    hostModeLabel: hostModeLabel[resource.hostMode],
    licenseStatus: resource.licenseStatus,
    licenseStatusLabel: licenseStatusLabel[resource.licenseStatus],
    downloadPolicy: resource.downloadPolicy,
    files,
    facts: toResourceFacts(resource),
    download: toDownloadPanelView(resource, files),
    related,
  };
}

function repositoryOrDefault(repository?: ResourceRepository) {
  return repository ?? jsonResourceRepository;
}

export async function listResourceSummaries(
  filters: ResourceFilters = {},
  repository?: ResourceRepository,
) {
  const resources = await repositoryOrDefault(repository).list(filters);

  return resources.map(toResourceSummaryView);
}

export async function searchResourceSummaries(
  query: string,
  repository?: ResourceRepository,
) {
  return listResourceSummaries({ query }, repository);
}

export async function getResourceDetail(
  resourceId: string,
  repository?: ResourceRepository,
) {
  const resourceRepository = repositoryOrDefault(repository);
  const resource = await resourceRepository.findById(resourceId);

  if (!resource) {
    return null;
  }

  const relatedResources = await resourceRepository.list({ level: resource.level });
  const related = relatedResources
    .filter(
      (candidate) =>
        candidate.id !== resource.id && candidate.type !== resource.type,
    )
    .slice(0, 3)
    .map(toResourceSummaryView);

  return toResourceDetailView(resource, related);
}

export async function getLevelOverview(
  level: ExamLevel,
  repository?: ResourceRepository,
): Promise<LevelOverviewView> {
  const summaries = await listResourceSummaries(
    { level },
    repositoryOrDefault(repository),
  );
  const buckets = Object.entries(typeLabel).map(([type, label]) => {
    const resourceType = type as ResourceType;
    const latest = summaries.filter((resource) => resource.type === resourceType);

    return {
      type: resourceType,
      label,
      count: latest.length,
      latest,
    };
  });

  return {
    level,
    label: levelLabel[level],
    total: summaries.length,
    buckets,
  };
}

export async function getHomeOverview(
  repository?: ResourceRepository,
): Promise<HomeOverviewView> {
  const resourceRepository = repositoryOrDefault(repository);
  const [cet4, cet6, highlights] = await Promise.all([
    getLevelOverview("cet4", resourceRepository),
    getLevelOverview("cet6", resourceRepository),
    listResourceSummaries({}, resourceRepository),
  ]);

  return {
    levels: [cet4, cet6],
    highlights: highlights.slice(0, 5),
  };
}
