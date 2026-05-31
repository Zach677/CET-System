import type { ApiErrorCode } from "~/server/api-error.server";

export const MAX_DOWNLOAD_REQUEST_BODY_BYTES = 1024;

type DownloadRequestBodySuccess = {
  ok: true;
  fileId?: string | null;
};

type DownloadRequestBodyFailure = {
  ok: false;
  status: 400;
  error: {
    code: Extract<ApiErrorCode, "invalid_request">;
    message: string;
  };
};

export type DownloadRequestBodyResult =
  | DownloadRequestBodySuccess
  | DownloadRequestBodyFailure;

function invalidRequest(message: string): DownloadRequestBodyFailure {
  return {
    ok: false,
    status: 400,
    error: {
      code: "invalid_request",
      message,
    },
  };
}

function parseContentLength(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function concatBytes(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const output = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

async function readBoundedText(
  request: Request,
  maxBytes: number,
): Promise<string | DownloadRequestBodyFailure> {
  const contentLength = parseContentLength(request.headers.get("content-length"));

  if (contentLength && contentLength > maxBytes) {
    return invalidRequest("请求体过大");
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      return invalidRequest("请求体过大");
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(concatBytes(chunks, totalBytes));
}

export async function readDownloadRequestBody(
  request: Request,
  maxBytes = MAX_DOWNLOAD_REQUEST_BODY_BYTES,
): Promise<DownloadRequestBodyResult> {
  const text = await readBoundedText(request, maxBytes);

  if (typeof text !== "string") {
    return text;
  }

  if (!text.trim()) {
    return invalidRequest("文件 ID 缺失");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return invalidRequest("请求体不是有效 JSON");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return invalidRequest("请求体格式无效");
  }

  const payload = parsed as { fileId?: unknown };
  const fileId = payload.fileId;

  if (fileId === undefined || fileId === null) {
    return invalidRequest("文件 ID 缺失");
  }

  if (typeof fileId !== "string") {
    return invalidRequest("文件 ID 格式无效");
  }

  const normalizedFileId = fileId.trim();

  if (!normalizedFileId) {
    return invalidRequest("文件 ID 缺失");
  }

  return {
    ok: true,
    fileId: normalizedFileId,
  };
}
