import type { ResourceFile } from "~/lib/resources";
import type { ApiErrorCode } from "~/server/api-error.server";
import {
  jsonResourceRepository,
  type ResourceRepository,
} from "~/server/resource-repository.server";

export type DownloadFilePayload = {
  label: string;
  path: string;
  cacheable: boolean;
};

export type DownloadSuccess = {
  ok: true;
  status: 200;
  payload: {
    kind: "signed";
    reasonCode: "owned_file_available";
    url: string;
    file: DownloadFilePayload;
  };
};

export type DownloadFailure = {
  ok: false;
  status: 400 | 404;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type OwnedResourceFileSuccess = {
  ok: true;
  resourceId: string;
  file: DownloadFilePayload;
};

type DownloadDecisionInput = {
  resourceId: string;
  filePath: string;
  requestUrl: string;
  publicBaseUrl?: string;
  repository?: ResourceRepository;
};

type OwnedResourceFileInput = {
  resourceId: string;
  filePath: string;
  repository?: ResourceRepository;
};

function repositoryOrDefault(repository?: ResourceRepository): ResourceRepository {
  return repository ?? jsonResourceRepository;
}

function downloadFailure(
  code: ApiErrorCode,
  message: string,
  status: 400 | 404,
): DownloadFailure {
  return {
    ok: false,
    status,
    error: {
      code,
      message,
    },
  };
}

function toDownloadFilePayload(file: ResourceFile): DownloadFilePayload {
  return {
    label: file.label,
    path: file.path,
    cacheable: file.cacheable,
  };
}

function buildPublicDownloadUrl(publicBaseUrl: string, filePath: string): string {
  return `${publicBaseUrl.replace(/\/+$/, "")}/${filePath}`;
}

function buildGatewayDownloadUrl(
  requestUrl: string,
  resourceId: string,
  filePath: string,
): string {
  const url = new URL(requestUrl);
  url.pathname = `/api/resources/${resourceId}/file`;
  url.search = "";
  url.searchParams.set("path", filePath);

  return url.toString();
}

export async function getOwnedResourceFile({
  resourceId,
  filePath,
  repository,
}: OwnedResourceFileInput): Promise<OwnedResourceFileSuccess | DownloadFailure> {
  const resource = await repositoryOrDefault(repository).findById(resourceId);

  if (!resource) {
    return downloadFailure("resource_not_found", "资源不存在", 404);
  }

  if (resource.hostMode !== "owned" || resource.downloadPolicy !== "signed") {
    return downloadFailure(
      "download_not_supported",
      "该资源不支持站内下载",
      400,
    );
  }

  const file = resource.files.find((candidate) => candidate.path === filePath);

  if (!file) {
    return downloadFailure("file_not_found", "文件不存在", 404);
  }

  return {
    ok: true,
    resourceId,
    file: toDownloadFilePayload(file),
  };
}

export async function decideResourceDownload({
  resourceId,
  filePath,
  requestUrl,
  publicBaseUrl,
  repository,
}: DownloadDecisionInput): Promise<DownloadSuccess | DownloadFailure> {
  const ownedFile = await getOwnedResourceFile({
    resourceId,
    filePath,
    repository,
  });

  if (!ownedFile.ok) {
    return ownedFile;
  }

  const trimmedPublicBaseUrl = publicBaseUrl?.trim();
  const url = trimmedPublicBaseUrl
    ? buildPublicDownloadUrl(trimmedPublicBaseUrl, filePath)
    : buildGatewayDownloadUrl(requestUrl, resourceId, filePath);

  return {
    ok: true,
    status: 200,
    payload: {
      kind: "signed",
      reasonCode: "owned_file_available",
      url,
      file: ownedFile.file,
    },
  };
}
