import { describe, expect, it } from "vitest";
import { isCronRequestAuthorized } from "@/lib/cron";

const SECRET = "cron-secret-123";

describe("isCronRequestAuthorized", () => {
  it("rejects requests when no secret is configured", () => {
    expect(
      isCronRequestAuthorized(undefined, { "x-cron-secret": SECRET }),
    ).toBe(false);
    expect(isCronRequestAuthorized("", { authorization: `Bearer ${SECRET}` })).toBe(
      false,
    );
  });

  it("accepts a matching x-cron-secret header", () => {
    expect(isCronRequestAuthorized(SECRET, { "x-cron-secret": SECRET })).toBe(
      true,
    );
  });

  it("accepts a matching Authorization Bearer header (Vercel Cron)", () => {
    expect(
      isCronRequestAuthorized(SECRET, { authorization: `Bearer ${SECRET}` }),
    ).toBe(true);
  });

  it("rejects a wrong x-cron-secret header", () => {
    expect(
      isCronRequestAuthorized(SECRET, { "x-cron-secret": "nope" }),
    ).toBe(false);
  });

  it("rejects a wrong Authorization header", () => {
    expect(
      isCronRequestAuthorized(SECRET, { authorization: "Bearer nope" }),
    ).toBe(false);
  });

  it("rejects requests with no headers", () => {
    expect(isCronRequestAuthorized(SECRET, {})).toBe(false);
    expect(
      isCronRequestAuthorized(SECRET, { "x-cron-secret": null, authorization: null }),
    ).toBe(false);
  });
});
