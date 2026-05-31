import { z } from "zod";

export const examLevelSchema = z.enum(["cet4", "cet6"]);
export const resourceTypeSchema = z.enum([
  "papers",
  "mocks",
  "skills",
  "listening",
  "resources",
]);
export const licenseStatusSchema = z.enum(["owned", "restricted", "external"]);
export const hostModeSchema = z.enum(["owned", "restricted", "external"]);
export const downloadPolicySchema = z.enum(["signed", "external", "none"]);
export const resourceFileKindSchema = z.enum(["pdf", "audio", "zip", "image"]);

export const resourceFileSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  kind: resourceFileKindSchema,
  path: z.string(),
  cacheable: z.boolean().default(false),
});

export const resourceSchema = z.object({
  id: z.string(),
  level: examLevelSchema,
  type: resourceTypeSchema,
  title: z.string(),
  summary: z.string(),
  year: z.number().int(),
  source: z.string(),
  licenseStatus: licenseStatusSchema,
  hostMode: hostModeSchema,
  downloadPolicy: downloadPolicySchema,
  externalUrl: z.string().url().nullable(),
  tags: z.array(z.string()).default([]),
  files: z.array(resourceFileSchema).default([]),
});

export type ExamLevel = z.infer<typeof examLevelSchema>;
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type LicenseStatus = z.infer<typeof licenseStatusSchema>;
export type HostMode = z.infer<typeof hostModeSchema>;
export type DownloadPolicy = z.infer<typeof downloadPolicySchema>;
export type ResourceFile = z.infer<typeof resourceFileSchema>;
export type ResourceRecord = z.infer<typeof resourceSchema>;

export const resourceCollectionSchema = z.array(resourceSchema);

export const levelLabel: Record<ExamLevel, string> = {
  cet4: "英语四级",
  cet6: "英语六级",
};

export const typeLabel: Record<ResourceType, string> = {
  papers: "历年真题",
  mocks: "模拟试卷",
  skills: "专项练习",
  listening: "听力资源",
  resources: "备考资源",
};

export function typeFromSlug(slug: string): ResourceType {
  return resourceTypeSchema.parse(slug);
}
