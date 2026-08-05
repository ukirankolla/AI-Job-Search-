import { afterEach, describe, expect, it } from "vitest";
import {
  canUse,
  isAdmin,
  WEEKLY_FREE_LIMIT,
  type UsageSnapshot,
} from "@/lib/subscription";

const baseUsage: UsageSnapshot = { resume_rewrite: 0, apply: 0 };

describe("isAdmin", () => {
  const original = process.env.ADMIN_EMAILS;

  afterEach(() => {
    process.env.ADMIN_EMAILS = original;
  });

  it("is false when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdmin("admin@example.com")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("matches against a comma-separated allowlist", () => {
    process.env.ADMIN_EMAILS = "Admin@Example.com, boss@acme.io";
    expect(isAdmin("admin@example.com")).toBe(true);
    expect(isAdmin("boss@acme.io")).toBe(true);
    expect(isAdmin("nobody@example.com")).toBe(false);
    expect(isAdmin("admin@example.com ")).toBe(true);
  });

  it("is case-insensitive", () => {
    process.env.ADMIN_EMAILS = "Admin@Example.com";
    expect(isAdmin("ADMIN@example.com")).toBe(true);
  });
});

describe("canUse", () => {
  it("premium tier has no limits", () => {
    expect(
      canUse(
        "premium",
        { resume_rewrite: WEEKLY_FREE_LIMIT, apply: WEEKLY_FREE_LIMIT },
        "resume_rewrite",
      ),
    ).toBe(true);
    expect(
      canUse("premium", { resume_rewrite: 500, apply: 500 }, "apply"),
    ).toBe(true);
  });

  it("free tier allows below the limit", () => {
    expect(
      canUse(
        "free",
        { resume_rewrite: WEEKLY_FREE_LIMIT - 1, apply: 0 },
        "resume_rewrite",
      ),
    ).toBe(true);
  });

  it("free tier blocks at the limit", () => {
    expect(
      canUse(
        "free",
        { resume_rewrite: WEEKLY_FREE_LIMIT, apply: 0 },
        "resume_rewrite",
      ),
    ).toBe(false);
    expect(
      canUse("free", { resume_rewrite: 0, apply: WEEKLY_FREE_LIMIT }, "apply"),
    ).toBe(false);
  });

  it("tracks each kind independently", () => {
    const usage = { resume_rewrite: WEEKLY_FREE_LIMIT, apply: 0 };
    expect(canUse("free", usage, "resume_rewrite")).toBe(false);
    expect(canUse("free", usage, "apply")).toBe(true);
  });

  it("usage defaults to zero", () => {
    expect(canUse("free", baseUsage, "resume_rewrite")).toBe(true);
  });
});
