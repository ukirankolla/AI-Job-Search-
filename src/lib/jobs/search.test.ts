import { describe, expect, it } from "vitest";
import { normalizeSearchHours } from "@/lib/jobs/search";

describe("search normalization", () => {
  it("treats an empty/default time filter as all jobs", () => {
    expect(normalizeSearchHours(null)).toBeNull();
    expect(normalizeSearchHours(undefined)).toBeNull();
    expect(normalizeSearchHours("all")).toBeNull();
    expect(normalizeSearchHours(8)).toBe(8);
  });
});
