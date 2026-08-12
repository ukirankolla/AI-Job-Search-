import { describe, expect, it } from "vitest";
import { getJobSourceLabel, isPipelineEligibleJob } from "@/lib/jobs/pipelineEligibility";

describe("pipelineEligibility", () => {
  it("rejects LinkedIn search results without a direct company apply link", () => {
    expect(
      isPipelineEligibleJob({
        source: "linkedin",
        url: "https://www.linkedin.com/jobs/view/123",
        apply_url: "",
      }),
    ).toBe(false);
  });

  it("allows manual jobs and company-site jobs", () => {
    expect(
      isPipelineEligibleJob({
        source: "manual",
        url: "https://example.com/jobs/123",
        apply_url: "https://example.com/apply",
      }),
    ).toBe(true);

    expect(
      isPipelineEligibleJob({
        source: "greenhouse",
        url: "https://boards.greenhouse.io/acme/jobs/7",
        apply_url: "https://boards.greenhouse.io/acme/jobs/7",
      }),
    ).toBe(true);
  });

  it("labels the source clearly for search-generated jobs", () => {
    expect(getJobSourceLabel("linkedin")).toBe("LinkedIn");
    expect(getJobSourceLabel("manual")).toBe("Manual");
  });
});
