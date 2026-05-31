import { describe, expect, it } from "vitest";

import {
  MAX_RESOURCE_QUERY_LENGTH,
  normalizeResourceQuery,
} from "~/lib/resource-query";

describe("resource query normalization", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeResourceQuery("  四级   听力\n真题  ")).toBe(
      "四级 听力 真题",
    );
  });

  it("returns undefined for empty queries", () => {
    expect(normalizeResourceQuery("   ")).toBeUndefined();
    expect(normalizeResourceQuery(null)).toBeUndefined();
    expect(normalizeResourceQuery(undefined)).toBeUndefined();
  });

  it("caps query length before repository or database work", () => {
    const query = "a".repeat(MAX_RESOURCE_QUERY_LENGTH + 20);

    expect(normalizeResourceQuery(query)).toHaveLength(
      MAX_RESOURCE_QUERY_LENGTH,
    );
  });
});
