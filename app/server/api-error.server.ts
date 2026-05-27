export type ApiErrorCode =
  | "resource_not_found"
  | "file_not_found"
  | "download_not_supported"
  | "download_rate_limited"
  | "download_budget_limited"
  | "invalid_request"
  | "storage_object_missing";

export type ApiErrorPayload = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export function apiErrorPayload(
  code: ApiErrorCode,
  message: string,
): ApiErrorPayload {
  return {
    error: {
      code,
      message,
    },
  };
}

export function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");

  return Response.json(apiErrorPayload(code, message), {
    ...init,
    status,
    headers,
  });
}
