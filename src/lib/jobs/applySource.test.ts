import { describe, expect, it } from "vitest";
import { classifyApplySource, isDirectSource } from "@/lib/jobs/applySource";

describe("classifyApplySource", () => {
  it("marks LinkedIn URLs as linkedin", () => {
    expect(classifyApplySource("https://www.linkedin.com/jobs/view/123")).toBe(
      "linkedin",
    );
    expect(classifyApplySource("https://linkedin.com/jobs/view/456")).toBe(
      "linkedin",
    );
  });

  it("marks company career sites as company", () => {
    expect(
      classifyApplySource("https://careers.northwindlabs.com/jobs/senior"),
    ).toBe("company");
    expect(
      classifyApplySource("https://acme.workdayjobs.com/jobs/42"),
    ).toBe("company");
    expect(
      classifyApplySource("https://boards.greenhouse.io/acme/jobs/7"),
    ).toBe("company");
  });

  it("marks known job boards as board", () => {
    expect(classifyApplySource("https://www.adzuna.com/jobs/abc")).toBe("board");
    expect(classifyApplySource("https://www.indeed.com/viewjob?jk=1")).toBe(
      "board",
    );
    expect(classifyApplySource("https://www.usajobs.gov/GetJob/ViewDetails/1")).toBe(
      "board",
    );
  });

  it("returns unknown for missing or invalid urls", () => {
    expect(classifyApplySource(null)).toBe("unknown");
    expect(classifyApplySource("not a url")).toBe("unknown");
  });
});

describe("isDirectSource", () => {
  it("accepts linkedin and company sites", () => {
    expect(isDirectSource("https://linkedin.com/jobs/view/1")).toBe(true);
    expect(isDirectSource("https://acme.careers.example/job")).toBe(true);
  });

  it("rejects boards and unknowns", () => {
    expect(isDirectSource("https://www.monster.com/job/1")).toBe(false);
    expect(isDirectSource(null)).toBe(false);
  });
});
