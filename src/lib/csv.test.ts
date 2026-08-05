import { describe, expect, it } from "vitest";
import { csvToJobs, parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps commas inside quoted fields", () => {
    expect(parseCsv('"React, Node.js",company')).toEqual([
      ["React, Node.js", "company"],
    ]);
  });

  it("handles escaped quotes and newlines inside quoted fields", () => {
    expect(parseCsv('"line1\nline2","said ""hi"""')).toEqual([
      ["line1\nline2", 'said "hi"'],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("skips blank rows", () => {
    expect(parseCsv("a,b\n\n1,2\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("csvToJobs", () => {
  it("maps headers to job fields", () => {
    const jobs = csvToJobs(
      [
        "title,company,location,description,url,salary_min,salary_max,external_id,source",
        "Senior Engineer,Acme,Remote,Build stuff,https://acme.com/job,120000,150000,ext-1,feed",
      ].join("\n"),
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toEqual({
      title: "Senior Engineer",
      company: "Acme",
      location: "Remote",
      description: "Build stuff",
      url: "https://acme.com/job",
      salary_min: 120000,
      salary_max: 150000,
      external_id: "ext-1",
      source: "feed",
      posted_at: undefined,
    });
  });

  it("ignores unknown columns and missing fields", () => {
    const jobs = csvToJobs(["title,posted_at", "QA Engineer,2024-01-15"].join("\n"));
    expect(jobs[0]).toEqual({
      title: "QA Engineer",
      posted_at: "2024-01-15",
      company: undefined,
      location: undefined,
      description: undefined,
      url: undefined,
      salary_min: undefined,
      salary_max: undefined,
      external_id: undefined,
      source: undefined,
    });
  });

  it("returns an empty array when there is only a header or no content", () => {
    expect(csvToJobs("title,company")).toEqual([]);
    expect(csvToJobs("")).toEqual([]);
  });
});
