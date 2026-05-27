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

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function run(
  command,
  args,
  { allowFailure = false, stdio = allowFailure ? "pipe" : "inherit" } = {},
) {
  const result = spawnSync(command, args, {
    stdio,
    encoding: "utf8",
  });

  if (result.error && !allowFailure) {
    console.error(result.error.message);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0 && !allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result;
}

function parseWranglerVersion(value) {
  const match = value.match(/(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return null;
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    raw: match[0],
  };
}

function isWranglerVersionSupported(version) {
  if (!version) {
    return false;
  }

  if (version.major > 4) {
    return true;
  }

  return version.major === 4 && version.minor >= 36;
}

function ensureWranglerVersion() {
  const result = run("npx", ["wrangler", "--version"], {
    allowFailure: true,
    stdio: "pipe",
  });

  if (result.error || (result.status ?? 1) !== 0) {
    console.error("Unable to run Wrangler. Install dependencies first:");
    console.error("  npm install");
    process.exit(result.status ?? 1);
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const version = parseWranglerVersion(output);

  if (!isWranglerVersionSupported(version)) {
    console.error(
      "Wrangler 4.36.0 or newer is required for Rate Limiting bindings.",
    );
    console.error(`Detected: ${version?.raw ?? "unknown"}`);
    process.exit(1);
  }

  console.log(`Using Wrangler ${version.raw}`);
}

function isMissingR2BucketError(detail) {
  return /not found|does not exist|could not find|missing|404/i.test(detail);
}

function bucketExists(bucketName) {
  const result = run(
    "npx",
    ["wrangler", "r2", "bucket", "info", bucketName, "--json"],
    {
      allowFailure: true,
      stdio: "pipe",
    },
  );

  if ((result.status ?? 1) === 0) {
    return true;
  }

  const detail = stripAnsi(
    `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim(),
  );

  if (isMissingR2BucketError(detail)) {
    return false;
  }

  console.error(`Failed to inspect R2 bucket: ${bucketName}`);
  if (detail) {
    console.error(detail);
  }
  process.exit(result.status ?? 1);
}

function hasR2Buckets(config) {
  return (config.r2_buckets ?? []).some((bucket) => bucket.bucket_name);
}

function ensureCloudflareAuth() {
  console.log("Checking Cloudflare authentication...");
  const result = run("npx", ["wrangler", "whoami"], {
    allowFailure: true,
    stdio: "pipe",
  });

  if ((result.status ?? 1) === 0) {
    return;
  }

  const detail = stripAnsi(
    `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim(),
  );

  console.error("\nCloudflare authentication is required to create resources.");
  console.error("Run one of these, then retry `npm run cloudflare:bootstrap`:");
  console.error("  npm run cloudflare:login");
  console.error("  CLOUDFLARE_API_TOKEN=<token> npm run cloudflare:bootstrap");
  console.error(
    "\nIf Wrangler is running inside a container, use `npm run cloudflare:login -- --callback-host=0.0.0.0` and ensure port 8976 is forwarded.",
  );

  if (detail) {
    console.error(`\nWrangler authentication check failed:\n${detail}`);
  }

  process.exit(result.status ?? 1);
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

ensureWranglerVersion();

if (!dryRun && hasR2Buckets(config)) {
  ensureCloudflareAuth();
}

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
