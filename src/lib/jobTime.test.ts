import { describe, expect, it } from "vitest";
import { formatRelativeTime, isRecentlyPosted } from "@/lib/jobTime";

const now = new Date("2026-08-05T12:00:00Z");

describe("isRecentlyPosted", () => {
  it("is true within the window", () => {
    expect(isRecentlyPosted("2026-08-05T06:00:00Z", 8, now)).toBe(true);
  });

  it("is false outside the window and for bad input", () => {
    expect(isRecentlyPosted("2026-08-05T03:59:00Z", 8, now)).toBe(false);
    expect(isRecentlyPosted(null, 8, now)).toBe(false);
    expect(isRecentlyPosted("not-a-date", 8, now)).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  it("formats minute/hour/day buckets", () => {
    expect(formatRelativeTime("2026-08-05T11:59:00Z", now)).toBe("1m ago");
    expect(formatRelativeTime("2026-08-05T10:00:00Z", now)).toBe("2h ago");
    expect(formatRelativeTime("2026-08-03T12:00:00Z", now)).toBe("2d ago");
    expect(formatRelativeTime("2026-08-05T11:59:30Z", now)).toBe("just now");
  });

  it("handles bad input", () => {
    expect(formatRelativeTime(null, now)).toBe("unknown");
  });
});
