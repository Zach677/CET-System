import type {
  DownloadPolicy,
  ExamLevel,
  HostMode,
  LicenseStatus,
  ResourceFile,
  ResourceType,
} from "~/lib/resources";

type ResourceFileKind = ResourceFile["kind"];

export const hostModeLabel: Record<HostMode, string> = {
  owned: "站内托管",
  restricted: "来源受限",
  external: "外部来源",
};

export const licenseStatusLabel: Record<LicenseStatus, string> = {
  owned: "可控授权",
  restricted: "受限资源",
  external: "外部授权",
};

export const fileKindLabel: Record<ResourceFileKind, string> = {
  pdf: "PDF",
  audio: "Audio",
  zip: "ZIP",
  image: "Image",
};

export type ResourceSummaryView = {
  id: string;
  level: ExamLevel;
  levelLabel: string;
  type: ResourceType;
  typeLabel: string;
  title: string;
  summary: string;
  year: number;
  source: string;
  tags: string[];
  tagLine: string;
  fileCount: number;
  cacheableFileCount: number;
};

export type ResourceFactView = {
  label: string;
  value: string;
};

export type ResourceFileView = {
  id: string;
  label: string;
  kind: ResourceFileKind;
  kindLabel: string;
  cacheable: boolean;
  cacheLabel: string;
};

export type ResourceDownloadPanelView =
  | {
      mode: "owned";
      title: string;
      description: string;
      resourceId: string;
      resourceType: ResourceType;
      files: ResourceFileView[];
      fileCount: number;
      cacheableFileCount: number;
    }
  | {
      mode: "external";
      title: string;
      description: string;
      externalUrl: string;
    }
  | {
      mode: "unavailable";
      title: string;
      description: string;
    };

export type ResourceDetailView = ResourceSummaryView & {
  externalUrl: string | null;
  hostMode: HostMode;
  hostModeLabel: string;
  licenseStatus: LicenseStatus;
  licenseStatusLabel: string;
  downloadPolicy: DownloadPolicy;
  files: ResourceFileView[];
  facts: ResourceFactView[];
  download: ResourceDownloadPanelView;
  related: ResourceSummaryView[];
};

export type ResourceBucketOverviewView = {
  type: ResourceType;
  label: string;
  count: number;
  latest: ResourceSummaryView[];
};

export type LevelOverviewView = {
  level: ExamLevel;
  label: string;
  total: number;
  buckets: ResourceBucketOverviewView[];
};

export type HomeOverviewView = {
  levels: LevelOverviewView[];
  highlights: ResourceSummaryView[];
};
