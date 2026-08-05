import { describe, expect, it } from "vitest";
import { filterJobs, type SearchableJob } from "@/lib/jobFilter";

const jobs: SearchableJob[] = [
  {
    title: "Senior Frontend Engineer",
    company: "Acme Cloud",
    location: "Remote",
    description: "Build React and TypeScript dashboards.",
  },
  {
    title: "Backend Engineer",
    company: "Dataflow Labs",
    location: "New York, NY",
    description: "Node.js services on Postgres.",
  },
  {
    title: "Data Analyst",
    company: "Northstar Analytics",
    location: "Chicago, IL",
    description: "SQL, dashboards, and A/B testing.",
  },
];

describe("filterJobs", () => {
  it("returns all jobs for an empty or whitespace query", () => {
    expect(filterJobs(jobs, "")).toEqual(jobs);
    expect(filterJobs(jobs, "   ")).toEqual(jobs);
  });

  it("matches against the title", () => {
    expect(filterJobs(jobs, "frontend")).toHaveLength(1);
    expect(filterJobs(jobs, "frontend")[0].title).toBe(
      "Senior Frontend Engineer",
    );
  });

  it("matches against company, location, and description", () => {
    expect(filterJobs(jobs, "acme")).toHaveLength(1);
    expect(filterJobs(jobs, "chicago")).toHaveLength(1);
    expect(filterJobs(jobs, "postgres")).toHaveLength(1);
  });

  it("is case-insensitive", () => {
    expect(filterJobs(jobs, "FRONTEND")).toHaveLength(1);
    expect(filterJobs(jobs, "Dataflow")).toHaveLength(1);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterJobs(jobs, "quantum")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const before = jobs.length;
    filterJobs(jobs, "engineer");
    expect(jobs.length).toBe(before);
  });
});
