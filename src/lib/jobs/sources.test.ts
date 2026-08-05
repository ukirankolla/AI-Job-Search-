import { describe, expect, it } from "vitest";
import {
  getJobSource,
  isPostedWithinHours,
  mapAdzunaJobs,
  mapUsaJobsJobs,
  mockJobs,
} from "@/lib/jobs/sources";

const now = new Date("2026-08-05T12:00:00Z");

describe("isPostedWithinHours", () => {
  it("accepts postings within the window", () => {
    expect(
      isPostedWithinHours("2026-08-05T09:00:00Z", 8, now),
    ).toBe(true);
  });

  it("rejects postings older than the window", () => {
    expect(
      isPostedWithinHours("2026-08-04T12:00:00Z", 8, now),
    ).toBe(false);
  });

  it("rejects future and missing dates", () => {
    expect(isPostedWithinHours("2026-08-06T00:00:00Z", 8, now)).toBe(false);
    expect(isPostedWithinHours(null, 8, now)).toBe(false);
  });
});

describe("mapAdzunaJobs", () => {
  it("maps fresh Adzuna results into job postings", () => {
    const jobs = mapAdzunaJobs(
      {
        results: [
          {
            id: "abc123",
            title: "Frontend Engineer",
            created: "2026-08-05T10:00:00Z",
            company: { display_name: "Acme" },
            location: { display_name: "Austin, TX" },
            description: "React + TypeScript",
            redirect_url: "https://adzuna.com/jobs/abc123",
            salary_min: 110000,
            salary_max: 140000,
          },
        ],
      },
      8,
      now,
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "adzuna",
      external_id: "abc123",
      title: "Frontend Engineer",
      company: "Acme",
      location: "Austin, TX",
      url: "https://adzuna.com/jobs/abc123",
      salary_min: 110000,
      salary_max: 140000,
    });
  });

  it("drops jobs older than the window and incomplete rows", () => {
    const jobs = mapAdzunaJobs(
      {
        results: [
          { id: "old", title: "Old Role", created: "2026-07-01T00:00:00Z" },
          { title: "No Id", created: "2026-08-05T10:00:00Z" },
        ],
      },
      8,
      now,
    );
    expect(jobs).toHaveLength(0);
  });
});

describe("mapUsaJobsJobs", () => {
  it("maps fresh USAJobs results with apply URI and salary", () => {
    const jobs = mapUsaJobsJobs(
      {
        SearchResult: {
          SearchResultItems: [
            {
              MatchedObjectId: "70000001",
              MatchedObjectDescriptor: {
                PositionTitle: "IT Specialist",
                PositionStartDate: "2026-08-05T08:00:00Z",
                OrganizationName: "USDA",
                PositionLocation: [{ LocationName: "Washington DC" }],
                JobSummary: "Support federal IT systems.",
                ApplyURI: [{ url: "https://www.usajobs.gov/GetJob/ViewDetails/70000001" }],
                PositionRemuneration: [
                  { MinimumRange: 72000, MaximumRange: 98000 },
                ],
              },
            },
          ],
        },
      },
      8,
      now,
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "usajobs",
      external_id: "70000001",
      title: "IT Specialist",
      company: "USDA",
      location: "Washington DC",
      url: "https://www.usajobs.gov/GetJob/ViewDetails/70000001",
      salary_min: 72000,
      salary_max: 98000,
    });
  });

  it("skips items without a title or that are too old", () => {
    const jobs = mapUsaJobsJobs(
      {
        SearchResult: {
          SearchResultItems: [
            {
              MatchedObjectId: "1",
              MatchedObjectDescriptor: {
                PositionTitle: "Old Job",
                PositionStartDate: "2026-01-01T00:00:00Z",
              },
            },
            {
              MatchedObjectId: "2",
              MatchedObjectDescriptor: {
                PositionStartDate: "2026-08-05T08:00:00Z",
              },
            },
          ],
        },
      },
      8,
      now,
    );
    expect(jobs).toHaveLength(0);
  });
});

describe("mock source", () => {
  it("produces deterministic listings within the window", () => {
    const jobs = mockJobs(8, now);
    expect(jobs.length).toBeGreaterThan(0);
    for (const job of jobs) {
      expect(isPostedWithinHours(job.posted_at, 8, now)).toBe(true);
      expect(job.source).toBe("mock");
      expect(job.url).toBeTruthy();
    }
  });
});

describe("getJobSource", () => {
  it("defaults to mock", () => {
    expect(getJobSource(undefined).name).toBe("mock");
  });

  it("resolves configured sources", () => {
    expect(getJobSource("adzuna").name).toBe("adzuna");
    expect(getJobSource("usajobs").name).toBe("usajobs");
  });
});
