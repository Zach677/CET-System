#!/usr/bin/env tsx

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type SmokeArgs = {
  resourceId: string;
  fileId: string;
  deploymentUrl: string;
  localFile?: string;
  accountId?: string;
  skipUpload?: boolean;
};

export type R2DownloadSmokePlan = {
  resourceId: string;
  fileId: string;
  bucketName: string;
  objectKey: string;
  contentType: string;
  localFile?: string;
  accountId?: string;
  downloadDecisionUrl: string;
  fileGatewayUrl: string;
};

export type R2UploadCommand = {
  command: string;
  args: string[];
  env?: Record<string, string>;
  failureHint: string;
};

type WranglerConfig = {
  r2_buckets?: Array<{
    binding?: string;
    bucket_name?: string;
  }>;
};

type ResourceFile = {
  id: string;
  label: string;
  kind: "pdf" | "audio" | "zip" | "image" | "html";
  path: string;
  cacheable: boolean;
};

type ResourceRecord = {
  id: string;
  hostMode: "owned" | "restricted" | "external";
  downloadPolicy: "signed" | "external" | "none";
  files: ResourceFile[];
};

type CreatePlanInput = SmokeArgs & {
  resources: unknown[];
  wranglerConfig: WranglerConfig;
};

function usage(): string {
  return [
    "Usage:",
    "  npm run smoke:download -- --resource <id> --file <fileId> --deployment-url <url> [--local-file <path>] [--account-id <id>] [--skip-upload]",
    "",
    "Examples:",
    "  npm run smoke:download -- --resource cet4-exam-day-checklist --file study-card-html --deployment-url https://example.workers.dev --local-file content/owned/cet4-exam-day-checklist.html --account-id <cloudflare-account-id>",
    "  npm run smoke:download -- --resource cet4-exam-day-checklist --file study-card-html --deployment-url https://example.workers.dev --skip-upload",
  ].join("\n");
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

export function parseSmokeArgs(argv: string[]): SmokeArgs {
  const args: Partial<SmokeArgs> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];

    switch (flag) {
      case "--resource":
        args.resourceId = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--file":
        args.fileId = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--deployment-url":
        args.deploymentUrl = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--local-file":
        args.localFile = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--account-id":
        args.accountId = requireValue(argv, index, flag);
        index += 1;
        break;
      case "--skip-upload":
        args.skipUpload = true;
        break;
      case "--help":
      case "-h":
        throw new Error(usage());
      default:
        throw new Error(`Unknown argument: ${flag}\n\n${usage()}`);
    }
  }

  if (!args.resourceId) {
    throw new Error(`Missing --resource\n\n${usage()}`);
  }

  if (!args.fileId) {
    throw new Error(`Missing --file\n\n${usage()}`);
  }

  if (!args.deploymentUrl) {
    throw new Error(`Missing --deployment-url\n\n${usage()}`);
  }

  return {
    resourceId: args.resourceId,
    fileId: args.fileId,
    deploymentUrl: args.deploymentUrl,
    localFile: args.localFile,
    accountId: args.accountId,
    skipUpload: args.skipUpload,
  };
}

function stripJsonComments(input: string): string {
  let output = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        output += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (!inString && char === "/" && nextChar === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (!inString && char === "/" && nextChar === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    output += char;

    if (char === "\\" && inString) {
      escaped = !escaped;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
    }

    escaped = false;
  }

  return output;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readJsonc(path: string): unknown {
  return JSON.parse(stripJsonComments(readFileSync(path, "utf8")));
}

function readContentResources(): unknown[] {
  const cet4 = readJson("content/cet4/resources.json");
  const cet6 = readJson("content/cet6/resources.json");

  return [...(cet4 as unknown[]), ...(cet6 as unknown[])];
}

function bucketNameFromConfig(config: WranglerConfig): string {
  const bucket =
    config.r2_buckets?.find((candidate) => candidate.binding === "RESOURCE_BUCKET") ??
    config.r2_buckets?.[0];

  if (!bucket?.bucket_name) {
    throw new Error("No R2 bucket configured in wrangler.jsonc");
  }

  return bucket.bucket_name;
}

function isResourceFile(value: unknown): value is ResourceFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const file = value as Record<string, unknown>;

  return (
    typeof file.id === "string" &&
    typeof file.label === "string" &&
    typeof file.path === "string" &&
    typeof file.cacheable === "boolean" &&
    (file.kind === "pdf" ||
      file.kind === "audio" ||
      file.kind === "zip" ||
      file.kind === "image" ||
      file.kind === "html")
  );
}

function parseResources(input: unknown[]): ResourceRecord[] {
  return input.map((value) => {
    if (!value || typeof value !== "object") {
      throw new Error("Content resource entries must be objects");
    }

    const resource = value as Record<string, unknown>;

    if (typeof resource.id !== "string") {
      throw new Error("Content resource is missing a string id");
    }

    if (
      resource.hostMode !== "owned" &&
      resource.hostMode !== "restricted" &&
      resource.hostMode !== "external"
    ) {
      throw new Error(`Resource ${resource.id} has an invalid hostMode`);
    }

    if (
      resource.downloadPolicy !== "signed" &&
      resource.downloadPolicy !== "external" &&
      resource.downloadPolicy !== "none"
    ) {
      throw new Error(`Resource ${resource.id} has an invalid downloadPolicy`);
    }

    if (!Array.isArray(resource.files) || !resource.files.every(isResourceFile)) {
      throw new Error(`Resource ${resource.id} has an invalid files manifest`);
    }

    return {
      id: resource.id,
      hostMode: resource.hostMode,
      downloadPolicy: resource.downloadPolicy,
      files: resource.files,
    };
  });
}

function resourceById(resources: ResourceRecord[], resourceId: string) {
  const resource = resources.find((candidate) => candidate.id === resourceId);

  if (!resource) {
    throw new Error(`Resource ${resourceId} was not found in authored content`);
  }

  return resource;
}

function assertOwnedSignedResource(resource: ResourceRecord) {
  if (resource.hostMode !== "owned" || resource.downloadPolicy !== "signed") {
    throw new Error(`Resource ${resource.id} is not an owned signed download`);
  }
}

function fileById(resource: ResourceRecord, fileId: string): ResourceFile {
  const file = resource.files.find((candidate) => candidate.id === fileId);

  if (!file) {
    throw new Error(`File ${fileId} was not found on resource ${resource.id}`);
  }

  return file;
}

function contentTypeForFile(file: ResourceFile): string {
  if (file.kind === "pdf") {
    return "application/pdf";
  }

  if (file.kind === "audio") {
    return file.path.endsWith(".mp3") ? "audio/mpeg" : "audio/*";
  }

  if (file.kind === "zip") {
    return "application/zip";
  }

  if (file.kind === "html") {
    return "text/html; charset=utf-8";
  }

  if (file.path.endsWith(".png")) {
    return "image/png";
  }

  if (file.path.endsWith(".jpg") || file.path.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

function urlFromDeployment(deploymentUrl: string, path: string): string {
  return new URL(path, deploymentUrl).toString();
}

export function createR2DownloadSmokePlan({
  resources,
  wranglerConfig,
  resourceId,
  fileId,
  deploymentUrl,
  localFile,
  accountId,
}: CreatePlanInput): R2DownloadSmokePlan {
  const parsedResources = parseResources(resources);
  const resource = resourceById(parsedResources, resourceId);
  assertOwnedSignedResource(resource);
  const file = fileById(resource, fileId);

  return {
    resourceId,
    fileId,
    bucketName: bucketNameFromConfig(wranglerConfig),
    objectKey: file.path,
    contentType: contentTypeForFile(file),
    localFile,
    accountId,
    downloadDecisionUrl: urlFromDeployment(
      deploymentUrl,
      `/api/resources/${resourceId}/download`,
    ),
    fileGatewayUrl: urlFromDeployment(
      deploymentUrl,
      `/api/resources/${resourceId}/file?fileId=${encodeURIComponent(fileId)}`,
    ),
  };
}

export function createR2UploadCommand(
  plan: R2DownloadSmokePlan & { localFile: string },
): R2UploadCommand {
  const localFile = resolve(plan.localFile);
  const env = plan.accountId
    ? {
        CLOUDFLARE_ACCOUNT_ID: plan.accountId,
      }
    : undefined;

  return {
    command: "npx",
    args: [
      "wrangler",
      "r2",
      "object",
      "put",
      `${plan.bucketName}/${plan.objectKey}`,
      "--file",
      localFile,
      "--content-type",
      plan.contentType,
      "--remote",
    ],
    env,
    failureHint: [
      "R2 upload failed before the Worker smoke could run.",
      "If Wrangler cannot retrieve /memberships, pass --account-id <cloudflare-account-id> or set CLOUDFLARE_ACCOUNT_ID.",
      "The active Cloudflare token also needs R2 object write access for the target bucket.",
    ].join("\n"),
  };
}

function run(command: string, args: string[], options: Pick<R2UploadCommand, "env" | "failureHint">) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    encoding: "utf8",
    env: options.env ? { ...process.env, ...options.env } : process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(
      [`${command} ${args.join(" ")} failed`, options.failureHint].join("\n\n"),
    );
  }
}

function uploadObject(plan: R2DownloadSmokePlan) {
  if (!plan.localFile) {
    console.log("No --local-file provided; assuming the R2 object already exists.");
    return;
  }

  const localFile = resolve(plan.localFile);
  if (!existsSync(localFile)) {
    throw new Error(`Local file does not exist: ${localFile}`);
  }

  if (!plan.accountId && !process.env.CLOUDFLARE_ACCOUNT_ID) {
    console.warn(
      "No Cloudflare account id provided. If Wrangler auth fails during upload, pass --account-id or set CLOUDFLARE_ACCOUNT_ID.",
    );
  }

  const uploadCommand = createR2UploadCommand({
    ...plan,
    localFile,
  });

  run(uploadCommand.command, uploadCommand.args, {
    env: uploadCommand.env,
    failureHint: uploadCommand.failureHint,
  });
}

async function fetchJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

async function smokeDownload(plan: R2DownloadSmokePlan) {
  const decisionResponse = await fetch(plan.downloadDecisionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileId: plan.fileId }),
  });

  const decisionPayload = await fetchJson(decisionResponse);

  if (!decisionResponse.ok) {
    throw new Error(
      `Download decision failed with ${decisionResponse.status}: ${JSON.stringify(
        decisionPayload,
      )}`,
    );
  }

  if (
    !decisionPayload ||
    typeof decisionPayload !== "object" ||
    typeof (decisionPayload as { url?: unknown }).url !== "string"
  ) {
    throw new Error("Download decision did not return a URL");
  }

  const fileResponse = await fetch((decisionPayload as { url: string }).url);
  await fileResponse.body?.cancel();

  if (!fileResponse.ok) {
    throw new Error(`File gateway failed with ${fileResponse.status}`);
  }

  console.log(`Download decision: ${decisionResponse.status}`);
  console.log(`File gateway: ${fileResponse.status}`);
}

async function main() {
  if (process.argv.slice(2).some((arg) => arg === "--help" || arg === "-h")) {
    console.log(usage());
    return;
  }

  const args = parseSmokeArgs(process.argv.slice(2));
  const wranglerConfig = readJsonc("wrangler.jsonc") as WranglerConfig;
  const resources = readContentResources();
  const plan = createR2DownloadSmokePlan({
    ...args,
    resources,
    wranglerConfig,
  });

  console.log("R2 download smoke target:");
  console.log(JSON.stringify(plan, null, 2));

  if (!args.skipUpload) {
    uploadObject(plan);
  } else {
    console.log("Upload skipped by --skip-upload.");
  }

  await smokeDownload(plan);
  console.log("R2 download smoke passed.");
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";

if (currentFilePath === invokedPath) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
