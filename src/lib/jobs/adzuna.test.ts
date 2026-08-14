import { describe, expect, it } from "vitest";
import {
  buildAdzunaSearchUrl,
  mapAdzunaEmploymentType,
  mapAdzunaJobs,
} from "@/lib/jobs/adzuna";
import { dedupeJobs } from "@/lib/jobs/search";

describe("buildAdzunaSearchUrl", () => {
  it("builds a US search URL with query, window, and location", () => {
    const url = buildAdzunaSearchUrl({
      query: "software engineer",
      hours: 12,
      location: "Austin, TX",
      appId: "id123",
      appKey: "key456",
    });
    expect(url).toContain("/v1/api/jobs/us/search/1?");
    expect(url).toContain("app_id=id123");
    expect(url).toContain("app_key=key456");
    expect(url).toContain("what=software+engineer");
    expect(url).toContain("where=Austin%2C+TX");
    expect(url).toContain("max_days_old=1");
  });

  it("scopes to the whole country when location is the default United States", () => {
    const url = buildAdzunaSearchUrl({
      location: "United States",
      hours: 48,
      appId: "id",
      appKey: "key",
    });
    expect(url).not.toContain("where=");
    expect(url).toContain("max_days_old=2");
  });

  it("does not add employment type filters to URL (filtered client-side)", () => {
    const url = buildAdzunaSearchUrl({
      employmentTypes: ["full_time", "c2c", "internship"],
      appId: "id",
      appKey: "key",
    });
    // No employment filters in URL — they're applied client-side
    expect(url).not.toContain("full_time=");
    expect(url).not.toContain("contract_type=");
  });
});

describe("mapAdzunaEmploymentType", () => {
  it("maps Adzuna contract types from contract_time field", () => {
    expect(mapAdzunaEmploymentType("permanent")).toBe("full_time");
    expect(mapAdzunaEmploymentType("contract")).toBe("c2c");
    expect(mapAdzunaEmploymentType("temporary")).toBe("c2c");
    expect(mapAdzunaEmploymentType("internships")).toBe("internship");
    expect(mapAdzunaEmploymentType("full_time")).toBe("full_time");
    expect(mapAdzunaEmploymentType(undefined)).toBeNull();
  });
});

describe("mapAdzunaJobs", () => {
  it("maps results into postings with employment_type detection", () => {
    const jobs = mapAdzunaJobs([
      {
        id: "abc123",
        title: "Frontend Engineer",
        company: { display_name: "Acme Inc" },
        location: { display_name: "Austin, TX" },
        description: "<p>Build React apps</p>",
        redirect_url: "https://www.acme.com/jobs/1",
        created: "2026-08-05T09:00:00Z",
        salary_min: 100000,
        salary_max: 140000,
        contract_time: "permanent",
      },
    ]);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "adzuna",
      external_id: "adzuna-abc123",
      title: "Frontend Engineer",
      company: "Acme Inc",
      location: "Austin, TX",
      description: "Build React apps",
      url: "https://www.acme.com/jobs/1",
      salary_min: 100000,
      salary_max: 140000,
      employment_type: "full_time",
    });
  });

  it("filters results by requested employment types", () => {
    const results = [
      {
        id: "1",
        title: "Full-time Job",
        redirect_url: "https://x.com/1",
        contract_time: "permanent",
      },
      {
        id: "2",
        title: "Contract Job",
        redirect_url: "https://x.com/2",
        contract_time: "contract",
      },
      {
        id: "3",
        title: "Internship",
        redirect_url: "https://x.com/3",
        contract_time: "internships",
      },
    ];

    // Filter for only full_time jobs
    const jobs = mapAdzunaJobs(results, ["full_time"]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].employment_type).toBe("full_time");

    // Filter for C2C jobs
    const c2c = mapAdzunaJobs(results, ["c2c"]);
    expect(c2c).toHaveLength(1);
    expect(c2c[0].employment_type).toBe("c2c");

    // No filter = all jobs
    const all = mapAdzunaJobs(results);
    expect(all).toHaveLength(3);
  });

  it("skips rows missing a title or URL", () => {
    const jobs = mapAdzunaJobs([
      { id: "1", title: "No URL" },
      { id: "2", redirect_url: "https://x.com/jobs/2" },
    ]);
    expect(jobs).toHaveLength(0);
  });
});

describe("dedupeJobs", () => {
  it("removes duplicate postings by URL", () => {
    const jobs = dedupeJobs([
      {
        source: "linkedin",
        external_id: "1",
        title: "Engineer",
        company: "A",
        location: "",
        description: "",
        url: "https://www.linkedin.com/jobs/view/1",
      },
      {
        source: "adzuna",
        external_id: "adzuna-1",
        title: "Engineer",
        company: "A",
        location: "",
        description: "",
        url: "https://www.linkedin.com/jobs/view/1/",
      },
    ]);
    expect(jobs).toHaveLength(1);
  });
});
