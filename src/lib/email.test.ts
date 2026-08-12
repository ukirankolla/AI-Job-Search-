import { describe, expect, it } from "vitest";
import { parseMailtoUrl } from "@/lib/email";

describe("parseMailtoUrl", () => {
  it("parses a plain mailto address", () => {
    expect(parseMailtoUrl("mailto:jobs@acme.com")).toEqual({
      to: "jobs@acme.com",
      subject: "",
    });
  });

  it("parses a mailto with a subject", () => {
    expect(
      parseMailtoUrl("mailto:hr@acme.com?subject=Senior%20Engineer"),
    ).toEqual({ to: "hr@acme.com", subject: "Senior Engineer" });
  });

  it("returns null for non-mailto URLs", () => {
    expect(parseMailtoUrl("https://careers.acme.com/jobs/1")).toBeNull();
    expect(parseMailtoUrl(null)).toBeNull();
    expect(parseMailtoUrl(undefined)).toBeNull();
    expect(parseMailtoUrl("")).toBeNull();
  });

  it("falls back to raw parsing when the URL is malformed", () => {
    expect(parseMailtoUrl("mailto:jobs@acme.com")).toEqual({
      to: "jobs@acme.com",
      subject: "",
    });
  });
});
