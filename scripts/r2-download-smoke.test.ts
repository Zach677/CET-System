import { describe, expect, it } from "vitest";

import {
  createR2DownloadSmokePlan,
  createR2UploadCommand,
  parseSmokeArgs,
} from "./r2-download-smoke";

const resources = [
  {
    id: "owned-paper",
    level: "cet4",
    type: "papers",
    title: "Owned paper",
    summary: "Controlled smoke resource.",
    year: 2026,
    source: "Owned source",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: [],
    files: [
      {
        id: "paper-pdf",
        label: "Paper PDF",
        kind: "pdf",
        path: "papers/owned-paper.pdf",
        cacheable: true,
      },
    ],
  },
  {
    id: "owned-study-card",
    level: "cet4",
    type: "skills",
    title: "Owned study card",
    summary: "Controlled HTML smoke resource.",
    year: 2026,
    source: "Owned source",
    licenseStatus: "owned",
    hostMode: "owned",
    downloadPolicy: "signed",
    externalUrl: null,
    tags: [],
    files: [
      {
        id: "study-card-html",
        label: "Study Card HTML",
        kind: "html",
        path: "owned/owned-study-card.html",
        cacheable: true,
      },
    ],
  },
  {
    id: "restricted-guide",
    level: "cet4",
    type: "listening",
    title: "Restricted guide",
    summary: "External only.",
    year: 2026,
    source: "External platform",
    licenseStatus: "restricted",
    hostMode: "restricted",
    downloadPolicy: "none",
    externalUrl: "https://example.com",
    tags: [],
    files: [],
  },
];

const wranglerConfig = {
  r2_buckets: [
    {
      binding: "RESOURCE_BUCKET",
      bucket_name: "cet-exam-system-assets",
    },
  ],
};

describe("r2 download smoke", () => {
  it("creates a smoke plan for an owned signed file", () => {
    const plan = createR2DownloadSmokePlan({
      resources,
      wranglerConfig,
      resourceId: "owned-paper",
      fileId: "paper-pdf",
      deploymentUrl: "https://cet.example/",
      localFile: "/tmp/owned-paper.pdf",
    });

    expect(plan).toEqual({
      resourceId: "owned-paper",
      fileId: "paper-pdf",
      bucketName: "cet-exam-system-assets",
      objectKey: "papers/owned-paper.pdf",
      contentType: "application/pdf",
      localFile: "/tmp/owned-paper.pdf",
      downloadDecisionUrl: "https://cet.example/api/resources/owned-paper/download",
      fileGatewayUrl: "https://cet.example/api/resources/owned-paper/file?fileId=paper-pdf",
    });
  });

  it("rejects resources that are not owned signed downloads", () => {
    expect(() =>
      createR2DownloadSmokePlan({
        resources,
        wranglerConfig,
        resourceId: "restricted-guide",
        fileId: "paper-pdf",
        deploymentUrl: "https://cet.example",
      }),
    ).toThrow("Resource restricted-guide is not an owned signed download");
  });

  it("uses the HTML content type for owned study cards", () => {
    const plan = createR2DownloadSmokePlan({
      resources,
      wranglerConfig,
      resourceId: "owned-study-card",
      fileId: "study-card-html",
      deploymentUrl: "https://cet.example/",
      localFile: "/tmp/owned-study-card.html",
    });

    expect(plan).toMatchObject({
      objectKey: "owned/owned-study-card.html",
      contentType: "text/html; charset=utf-8",
    });
  });

  it("parses smoke arguments", () => {
    expect(
      parseSmokeArgs([
        "--resource",
        "owned-paper",
        "--file",
        "paper-pdf",
        "--deployment-url",
        "https://cet.example",
        "--local-file",
        "/tmp/owned-paper.pdf",
        "--account-id",
        "cloudflare-account-id",
        "--skip-upload",
      ]),
    ).toEqual({
      resourceId: "owned-paper",
      fileId: "paper-pdf",
      deploymentUrl: "https://cet.example",
      localFile: "/tmp/owned-paper.pdf",
      accountId: "cloudflare-account-id",
      skipUpload: true,
    });
  });

  it("passes a supplied account id to the Wrangler upload command", () => {
    const command = createR2UploadCommand({
      resourceId: "owned-paper",
      fileId: "paper-pdf",
      bucketName: "cet-exam-system-assets",
      objectKey: "papers/owned-paper.pdf",
      contentType: "application/pdf",
      localFile: "/tmp/owned-paper.pdf",
      accountId: "cloudflare-account-id",
      downloadDecisionUrl: "https://cet.example/api/resources/owned-paper/download",
      fileGatewayUrl:
        "https://cet.example/api/resources/owned-paper/file?fileId=paper-pdf",
    });

    expect(command).toMatchObject({
      command: "npx",
      env: {
        CLOUDFLARE_ACCOUNT_ID: "cloudflare-account-id",
      },
    });
    expect(command.args).toContain("cet-exam-system-assets/papers/owned-paper.pdf");
    expect(command.args).toContain("--remote");
  });
});
