import type { ResourceRecord } from "~/lib/resources";
import {
  jsonResourceRepository,
  type ResourceFilters,
} from "~/server/resource-repository.server";

export { jsonResourceRepository } from "~/server/resource-repository.server";
export type {
  ResourceFilters,
  ResourceRepository,
} from "~/server/resource-repository.server";
export {
  getHomeOverview,
  getLevelOverview,
  getResourceDetail,
  listResourceSummaries,
  searchResourceSummaries,
} from "~/server/resource-service.server";
export {
  decideResourceDownload,
  getOwnedResourceFile,
} from "~/server/download-service.server";

export type DownloadDecision =
  | { kind: "signed"; enabled: true; label: string }
  | { kind: "external"; enabled: false; label: string }
  | { kind: "none"; enabled: false; label: string };

export async function listResources(filters: ResourceFilters = {}) {
  return jsonResourceRepository.list(filters);
}

export async function getResourceById(resourceId: string) {
  return jsonResourceRepository.findById(resourceId);
}

export function createDownloadDecision(
  resource: ResourceRecord,
): DownloadDecision {
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
