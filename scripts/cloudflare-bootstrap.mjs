#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const configPath = process.env.WRANGLER_CONFIG ?? "wrangler.jsonc";
const dryRun =
  process.argv.includes("--dry-run") ||
  process.env.CLOUDFLARE_BOOTSTRAP_DRY_RUN === "true";

function stripJsonComments(input) {
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

function readWranglerConfig() {
  return JSON.parse(stripJsonComments(readFileSync(configPath, "utf8")));
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    stdio: allowFailure ? "pipe" : "inherit",
    encoding: "utf8",
  });

  if (result.status !== 0 && !allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result;
}

function outputOf(command, args) {
  const result = run(command, args, { allowFailure: true });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }

  return `${result.stdout}\n${result.stderr}`;
}

function bucketExists(bucketName) {
  const output = outputOf("npx", ["wrangler", "r2", "bucket", "list"]);

  return output
    .split("\n")
    .some((line) => line.trim().split(/\s+/).includes(bucketName));
}

function ensureR2Bucket(bucket) {
  const bucketName = bucket.bucket_name;

  if (!bucketName) {
    return;
  }

  if (dryRun) {
    console.log(`Would ensure R2 bucket exists: ${bucketName}`);
    return;
  }

  if (bucketExists(bucketName)) {
    console.log(`R2 bucket already exists: ${bucketName}`);
    return;
  }

  console.log(`Creating R2 bucket: ${bucketName}`);
  run("npx", ["wrangler", "r2", "bucket", "create", bucketName]);
}

const config = readWranglerConfig();

for (const bucket of config.r2_buckets ?? []) {
  ensureR2Bucket(bucket);
}

if (dryRun) {
  console.log("Dry run enabled: no Cloudflare resources were created.");
}

console.log("Generating Cloudflare binding types...");
run("npm", ["run", "cf-typegen"]);

console.log("Validating Worker bundle and Wrangler bindings...");
run("npm", ["run", "check"]);

console.log("Cloudflare bootstrap complete.");
