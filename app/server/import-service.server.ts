import { z } from "zod";

import {
  examLevelSchema,
  levelLabel,
  typeLabel,
  resourceTypeSchema,
  type ExamLevel,
  type ResourceType,
} from "~/lib/resources";

type ImportLaneStatus = "available" | "planned";
type ImportStepStatus = "available" | "planned";

export type ImportLaneView = {
  id: "external-source" | "owned-file" | "manual-record";
  title: string;
  description: string;
  status: ImportLaneStatus;
};

export type ImportStepView = {
  id: "source" | "metadata" | "review" | "commit";
  title: string;
  description: string;
  status: ImportStepStatus;
};

export type ImportWorkbenchView = {
  lanes: ImportLaneView[];
  steps: ImportStepView[];
  guardrails: string[];
};

export type ImportDraftView = {
  title: string;
  sourceUrl: string;
  sourceName: string;
  summary: string;
  level: ExamLevel;
  levelLabel: string;
  type: ResourceType;
  typeLabel: string;
  hostMode: "external";
  downloadPolicy: "external";
  lifecycleStatus: "draft";
  commitStatus: "not_connected";
};

export type ImportDraftResult =
  | { ok: true; draft: ImportDraftView }
  | { ok: false; fieldErrors: Record<string, string[]> };

const draftSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters."),
  sourceUrl: z.string().trim().url("Source URL must be a valid URL."),
  sourceName: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  level: examLevelSchema,
  type: resourceTypeSchema,
});

function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function hostnameFromUrl(sourceUrl: string): string {
  return new URL(sourceUrl).hostname.replace(/^www\./, "");
}

export function getImportWorkbench(): ImportWorkbenchView {
  return {
    lanes: [
      {
        id: "external-source",
        title: "外部合法来源",
        description: "从来源 URL 生成一份待审核的资源元数据草稿。",
        status: "available",
      },
      {
        id: "owned-file",
        title: "自有文件上传",
        description: "把可控 PDF、音频、压缩包或图片写入 R2。",
        status: "planned",
      },
      {
        id: "manual-record",
        title: "手动资源记录",
        description: "记录暂时不适合托管的材料元信息。",
        status: "planned",
      },
    ],
    steps: [
      {
        id: "source",
        title: "选择来源",
        description: "先确认材料来自自有文件、外部合法来源或手动记录。",
        status: "available",
      },
      {
        id: "metadata",
        title: "生成草稿",
        description: "把标题、摘要、级别、分类和来源事实收敛成待审核记录。",
        status: "available",
      },
      {
        id: "review",
        title: "人工确认",
        description: "在写入库之前确认授权、托管方式和下载策略。",
        status: "available",
      },
      {
        id: "commit",
        title: "写入存储",
        description: "未来提交到 Neon 元数据表，并把自有文件写入 R2。",
        status: "planned",
      },
    ],
    guardrails: [
      "外部平台资源只保留来源说明和跳转，不复制受限文件。",
      "自有文件以后进入 R2，元数据以后进入 Neon。",
      "确认入库前不产生持久化写入。",
    ],
  };
}

export function createImportDraft(formData: FormData): ImportDraftResult {
  const result = draftSchema.safeParse({
    title: formValue(formData, "title"),
    sourceUrl: formValue(formData, "sourceUrl"),
    sourceName: formValue(formData, "sourceName"),
    summary: formValue(formData, "summary"),
    level: formValue(formData, "level"),
    type: formValue(formData, "type"),
  });

  if (!result.success) {
    return {
      ok: false,
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const sourceName =
    result.data.sourceName || hostnameFromUrl(result.data.sourceUrl);

  return {
    ok: true,
    draft: {
      title: result.data.title,
      sourceUrl: result.data.sourceUrl,
      sourceName,
      summary: result.data.summary || "待补充摘要。",
      level: result.data.level,
      levelLabel: levelLabel[result.data.level],
      type: result.data.type,
      typeLabel: typeLabel[result.data.type],
      hostMode: "external",
      downloadPolicy: "external",
      lifecycleStatus: "draft",
      commitStatus: "not_connected",
    },
  };
}
