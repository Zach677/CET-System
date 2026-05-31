export const MAX_RESOURCE_QUERY_LENGTH = 80;

export function normalizeResourceQuery(
  value: string | null | undefined,
): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, MAX_RESOURCE_QUERY_LENGTH);
}
