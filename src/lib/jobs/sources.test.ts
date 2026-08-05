import { describe, expect, it } from "vitest";
import {
  getJobSource,
  isPostedWithinHours,
  mapAshbyJobs,
  mapGreenhouseJobs,
  mapLeverJobs,
  mapWorkableJobs,
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

describe("mapAshbyJobs", () => {
  it("maps fresh Ashby board postings with employment type and direct URL", () => {
    const jobs = mapAshbyJobs(
      {
        jobs: [
          {
            title: "Product Engineer",
            location: "San Francisco",
            descriptionPlain: "Build product features.",
            publishedAt: "2026-08-05T10:00:00.000Z",
            employmentType: "FullTime",
            jobUrl: "https://jobs.ashbyhq.com/acme/abc123",
          },
        ],
      },
      8,
      now,
      "Acme",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "ashby",
      external_id: "https://jobs.ashbyhq.com/acme/abc123",
      title: "Product Engineer",
      company: "Acme",
      location: "San Francisco",
      url: "https://jobs.ashbyhq.com/acme/abc123",
      employment_type: "full_time",
    });
  });

  it("drops jobs missing a URL or older than the window", () => {
    const jobs = mapAshbyJobs(
      {
        jobs: [
          {
            title: "No URL",
            publishedAt: "2026-08-05T10:00:00.000Z",
            employmentType: "Intern",
          },
          {
            title: "Old Role",
            jobUrl: "https://jobs.ashbyhq.com/acme/old",
            publishedAt: "2026-07-01T00:00:00.000Z",
          },
        ],
      },
      8,
      now,
    );
    expect(jobs).toHaveLength(0);
  });
});

describe("mapWorkableJobs", () => {
  it("maps fresh Workable widget postings with direct apply links", () => {
    const jobs = mapWorkableJobs(
      {
        jobs: [
          {
            title: "Account Manager",
            url: "https://apply.workable.com/acme/j/ABC123",
            location: { location_str: "Chicago, IL" },
            description: "<p>Own key accounts.</p>",
            published_on: "2026-08-05T09:00:00Z",
            employment_type: "Full-time",
          },
        ],
      },
      8,
      now,
      "Acme",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "workable",
      external_id: "https://apply.workable.com/acme/j/ABC123",
      title: "Account Manager",
      company: "Acme",
      location: "Chicago, IL",
      url: "https://apply.workable.com/acme/j/ABC123",
      description: "Own key accounts.",
      employment_type: "full_time",
    });
  });

  it("skips jobs without a URL or without a fresh published date", () => {
    const jobs = mapWorkableJobs(
      {
        jobs: [
          { title: "No Link" },
          {
            title: "Old Role",
            url: "https://apply.workable.com/acme/j/OLD",
            published_on: "2026-07-01T00:00:00Z",
          },
        ],
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
    expect(getJobSource("greenhouse").name).toBe("greenhouse");
    expect(getJobSource("lever").name).toBe("lever");
    expect(getJobSource("workable").name).toBe("workable");
    expect(getJobSource("ashby").name).toBe("ashby");
  });
});
