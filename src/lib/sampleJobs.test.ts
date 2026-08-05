import { describe, expect, it } from "vitest";
import { SAMPLE_JOBS } from "@/lib/sampleJobs";

describe("SAMPLE_JOBS", () => {
  it("contains enough jobs to make a useful demo", () => {
    expect(SAMPLE_JOBS.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique external_ids", () => {
    const ids = SAMPLE_JOBS.map((j) => j.external_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a complete shape for the ingest route", () => {
    for (const job of SAMPLE_JOBS) {
      expect(job.source).toBe("sample");
      expect(job.external_id.length).toBeGreaterThan(0);
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.company.length).toBeGreaterThan(0);
      expect(job.location.length).toBeGreaterThan(0);
      expect(job.url).toMatch(/^https?:\/\//);
    }
  });

  it("gives agents enough description text to work with", () => {
    for (const job of SAMPLE_JOBS) {
      expect(job.description.length).toBeGreaterThanOrEqual(50);
    }
  });

  it("has sane salary ranges", () => {
    for (const job of SAMPLE_JOBS) {
      expect(job.salary_min).toBeGreaterThan(0);
      expect(job.salary_max).toBeGreaterThanOrEqual(job.salary_min);
    }
  });
});
