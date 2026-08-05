import { describe, expect, it } from "vitest";
import {
  getJobSource,
  isPostedWithinHours,
  mapGreenhouseJobs,
  mapLeverJobs,
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

describe("mapGreenhouseJobs", () => {
  it("maps fresh Greenhouse board jobs into postings with direct apply URLs", () => {
    const jobs = mapGreenhouseJobs(
      {
        jobs: [
          {
            id: 12345,
            title: "Frontend Engineer",
            updated_at: "2026-08-05T10:00:00Z",
            location: { name: "Austin, TX" },
            absolute_url: "https://boards.greenhouse.io/acme/jobs/12345",
            content: "<p>React + <strong>TypeScript</strong></p>",
          },
        ],
      },
      8,
      now,
      "Acme",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "greenhouse",
      external_id: "12345",
      title: "Frontend Engineer",
      company: "Acme",
      location: "Austin, TX",
      url: "https://boards.greenhouse.io/acme/jobs/12345",
      description: "React + TypeScript",
    });
  });

  it("drops jobs older than the window and incomplete rows", () => {
    const jobs = mapGreenhouseJobs(
      {
        jobs: [
          { id: 1, title: "Old Role", updated_at: "2026-07-01T00:00:00Z" },
          { title: "No Id", updated_at: "2026-08-05T10:00:00Z" },
        ],
      },
      8,
      now,
    );
    expect(jobs).toHaveLength(0);
  });
});

describe("mapLeverJobs", () => {
  it("maps fresh Lever postings with commitment and salary", () => {
    const jobs = mapLeverJobs(
      [
        {
          id: "lever-1",
          text: "Machine Learning Engineer",
          categories: { commitment: "Full-time", location: "Remote (US)" },
          hostedUrl: "https://jobs.lever.co/acme/lever-1",
          descriptionPlain: "Build LLM-powered products.",
          createdAt: now.getTime() - 2 * 60 * 60 * 1000,
          salaryRange: { min: 150000, max: 190000 },
        },
      ],
      8,
      now,
      "Acme",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "lever",
      external_id: "lever-1",
      title: "Machine Learning Engineer",
      company: "Acme",
      location: "Remote (US)",
      url: "https://jobs.lever.co/acme/lever-1",
      salary_min: 150000,
      salary_max: 190000,
      employment_type: "full_time",
    });
  });

  it("skips non-array payloads, old postings, and rows without a title", () => {
    expect(mapLeverJobs({ not: "an array" }, 8, now)).toHaveLength(0);
    const jobs = mapLeverJobs(
      [
        { id: "old", text: "Old Job", createdAt: now.getTime() - 40 * 60 * 60 * 1000 },
        { id: "no-title" },
      ],
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
    expect(getJobSource("greenhouse").name).toBe("greenhouse");
    expect(getJobSource("lever").name).toBe("lever");
  });
});
