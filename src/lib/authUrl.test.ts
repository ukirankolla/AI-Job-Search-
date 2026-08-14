import { afterEach, describe, expect, it } from "vitest";
import { authCallbackUrl } from "@/lib/authUrl";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("authCallbackUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL over the fallback origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://noventra.app";
    expect(authCallbackUrl("/dashboard", "https://preview.vercel.app")).toBe(
      "https://noventra.app/auth/callback?next=%2Fdashboard",
    );
  });

  it("falls back to the provided origin when the env var is unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(authCallbackUrl("/dashboard", "http://localhost:3000")).toBe(
      "http://localhost:3000/auth/callback?next=%2Fdashboard",
    );
  });

  it("returns a relative path when no origin is available", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(authCallbackUrl("/dashboard")).toBe(
      "/auth/callback?next=%2Fdashboard",
    );
  });

  it("strips trailing slashes from the origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://noventra.app/";
    expect(authCallbackUrl("/dashboard")).toBe(
      "https://noventra.app/auth/callback?next=%2Fdashboard",
    );
  });

  it("sanitizes an unsafe next value", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://noventra.app";
    expect(authCallbackUrl("https://evil.example", "http://localhost:3000")).toBe(
      "https://noventra.app/auth/callback?next=%2Fdashboard",
    );
  });

  it("encodes the next path in the query string", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://noventra.app";
    expect(authCallbackUrl("/jobs?ref=feed")).toBe(
      "https://noventra.app/auth/callback?next=%2Fjobs%3Fref%3Dfeed",
    );
  });
});
