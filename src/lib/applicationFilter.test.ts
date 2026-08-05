import { describe, expect, it } from "vitest";
import {
  filterApplications,
  type SearchableApplication,
} from "@/lib/applicationFilter";

const apps: SearchableApplication[] = [
  {
    title: "Senior Frontend Engineer",
    company: "Acme Cloud",
    status: "applied",
    match_score: 82,
  },
  {
    title: "Backend Engineer",
    company: "Dataflow Labs",
    status: "interviewing",
    match_score: 45,
  },
  {
    title: "Data Analyst",
    company: "Northstar Analytics",
    status: "saved",
    match_score: null,
  },
];

describe("filterApplications", () => {
  it("returns all applications for an empty or whitespace query", () => {
    expect(filterApplications(apps, "")).toEqual(apps);
    expect(filterApplications(apps, "   ")).toEqual(apps);
  });

  it("matches against the title", () => {
    expect(filterApplications(apps, "frontend")).toHaveLength(1);
    expect(filterApplications(apps, "frontend")[0].title).toBe(
      "Senior Frontend Engineer",
    );
  });

  it("matches against the company", () => {
    expect(filterApplications(apps, "dataflow")).toHaveLength(1);
  });

  it("matches against the status", () => {
    expect(filterApplications(apps, "interviewing")).toHaveLength(1);
    expect(filterApplications(apps, "saved")).toHaveLength(1);
  });

  it("is case-insensitive", () => {
    expect(filterApplications(apps, "NORTHSTAR")).toHaveLength(1);
  });

  it("matches a numeric query against match_score as a threshold", () => {
    expect(filterApplications(apps, "50")).toHaveLength(1);
    expect(filterApplications(apps, "40")).toHaveLength(2);
  });

  it("ignores the score threshold for apps with no match_score", () => {
    expect(filterApplications(apps, "10")).toHaveLength(2);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterApplications(apps, "quantum")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const before = apps.length;
    filterApplications(apps, "engineer");
    expect(apps.length).toBe(before);
  });
});
