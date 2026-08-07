import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobPosting, VerifierInput, VerificationResult } from "@/lib/types";

const {
  mockRunVerifier,
  mockFetchLinkedInJobPage,
  mockFetchLinkedInCompanyPage,
} = vi.hoisted(() => ({
  mockRunVerifier: vi.fn(),
  mockFetchLinkedInJobPage: vi.fn(),
  mockFetchLinkedInCompanyPage: vi.fn(),
}));

vi.mock("@/lib/jobs/linkedin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/jobs/linkedin")>();
  return {
    ...actual,
    fetchLinkedInJobPage: mockFetchLinkedInJobPage,
    fetchLinkedInCompanyPage: mockFetchLinkedInCompanyPage,
  };
});

vi.mock("@/lib/agents/workers", () => ({
  runVerifier: mockRunVerifier,
}));

import { verifyJob, verifyJobBatch } from "@/lib/jobs/verifier";

const LINKEDIN_HTML =
  '<a href="https://www.linkedin.com/company/northwind-labs">Northwind</a>';
const COMPANY_HTML = '"sameAs":"https://northwindlabs.com"';

function linkedinJob(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    title: "Senior Engineer",
    company: "Northwind Labs",
    location: "Remote",
    description: "",
    url: "https://www.linkedin.com/jobs/view/123",
    ...overrides,
  };
}

const agentVerdict: VerificationResult = {
  status: "likely",
  confidence: 85,
  apply_url: "https://northwindlabs.com/careers",
  source_url: "https://northwindlabs.com/careers",
  reason: "Company career site mentions the company.",
};

describe("verifyJob", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.restoreAllMocks();
    mockRunVerifier.mockReset();
    mockFetchLinkedInJobPage.mockReset();
    mockFetchLinkedInCompanyPage.mockReset();
    mockFetchLinkedInJobPage.mockResolvedValue(LINKEDIN_HTML);
    mockFetchLinkedInCompanyPage.mockResolvedValue(COMPANY_HTML);
    mockRunVerifier.mockResolvedValue(agentVerdict);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("marks company-domain jobs as verified without network or agent", async () => {
    const job: JobPosting = {
      title: "Engineer",
      company: "Northwind Labs",
      description: "",
      url: "https://careers.northwindlabs.com/jobs/99",
    };

    const result = await verifyJob(job);

    expect(result.status).toBe("verified");
    expect(result.apply_url).toBe("https://careers.northwindlabs.com/jobs/99");
    expect(result.source_url).toBe("https://careers.northwindlabs.com");
    expect(mockFetchLinkedInJobPage).not.toHaveBeenCalled();
    expect(mockRunVerifier).not.toHaveBeenCalled();
  });

  it("returns unverified for aggregator or missing URLs", async () => {
    const adzuna = await verifyJob({
      title: "Engineer",
      company: "Acme",
      description: "",
      url: "https://www.adzuna.com/redirect/xyz",
    });
    expect(adzuna.status).toBe("unverified");

    const noUrl = await verifyJob({
      title: "Engineer",
      company: "Acme",
      description: "",
    });
    expect(noUrl.status).toBe("unverified");
    expect(noUrl.apply_url).toBe("");
  });

  it("uses LinkedIn's exposed company apply link without the agent", async () => {
    mockFetchLinkedInJobPage.mockResolvedValue(
      '<a class="jobs-apply-button" href="https://jobs.lever.co/northwind/opening">Apply</a>',
    );

    const result = await verifyJob(linkedinJob());

    expect(result.status).toBe("verified");
    expect(result.apply_url).toBe("https://jobs.lever.co/northwind/opening");
    expect(mockRunVerifier).not.toHaveBeenCalled();
    expect(mockFetchLinkedInCompanyPage).not.toHaveBeenCalled();
  });

  it("resolves the company career site and asks the agent with evidence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "Northwind Labs is hiring engineers across the US.",
      } as Response),
    );

    const result = await verifyJob(linkedinJob());

    expect(result).toEqual(agentVerdict);
    expect(mockRunVerifier).toHaveBeenCalledTimes(1);
    const input = mockRunVerifier.mock.calls[0][0] as VerifierInput;
    expect(input.posting_url).toBe("https://www.linkedin.com/jobs/view/123");
    expect(input.candidate_apply_url).toBe("https://northwindlabs.com/careers");
    expect(input.company_page_excerpt).toContain("Northwind Labs");
  });

  it("falls back to unverified when the LinkedIn page cannot be reached", async () => {
    mockFetchLinkedInJobPage.mockRejectedValue(new Error("network down"));

    const result = await verifyJob(linkedinJob());

    expect(result.status).toBe("unverified");
    expect(mockRunVerifier).not.toHaveBeenCalled();
  });

  it("skips the network chain in mock mode and lets the agent judge", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    mockRunVerifier.mockResolvedValue({
      status: "unverified",
      confidence: 30,
      apply_url: "",
      source_url: "",
      reason: "No company-owned apply source found.",
    });

    const result = await verifyJob(linkedinJob());

    expect(mockFetchLinkedInJobPage).not.toHaveBeenCalled();
    expect(mockFetchLinkedInCompanyPage).not.toHaveBeenCalled();
    expect(mockRunVerifier).toHaveBeenCalledTimes(1);
    const input = mockRunVerifier.mock.calls[0][0] as VerifierInput;
    expect(input.candidate_source_url).toBe("");
    expect(result.status).toBe("unverified");
  });

  it("reports a failed agent verdict as unverified", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "Northwind Labs careers",
      } as Response),
    );
    mockRunVerifier.mockRejectedValue(new Error("LLM unavailable"));

    const result = await verifyJob(linkedinJob());

    expect(result.status).toBe("unverified");
  });
});

describe("verifyJobBatch", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    mockRunVerifier.mockReset();
    mockFetchLinkedInJobPage.mockReset();
    mockFetchLinkedInCompanyPage.mockReset();
    mockFetchLinkedInJobPage.mockResolvedValue(LINKEDIN_HTML);
    mockFetchLinkedInCompanyPage.mockResolvedValue(COMPANY_HTML);
    mockRunVerifier.mockResolvedValue(agentVerdict);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("verifies company-domain jobs instantly and caps LinkedIn checks", async () => {
    const jobs = [
      { ...linkedinJob(), url: "https://careers.northwindlabs.com/jobs/1" },
      { ...linkedinJob(), url: "https://www.linkedin.com/jobs/view/2" },
      { ...linkedinJob(), url: "https://www.linkedin.com/jobs/view/3" },
    ];

    const results = await verifyJobBatch(jobs, { maxLinkedIn: 1 });

    expect(results.size).toBe(3);
    expect(results.get("https://careers.northwindlabs.com/jobs/1")?.status).toBe("verified");
    expect(results.get("https://www.linkedin.com/jobs/view/2")?.status).toBe("likely");
    expect(results.get("https://www.linkedin.com/jobs/view/3")?.status).toBe("unverified");
    expect(mockFetchLinkedInJobPage).toHaveBeenCalledTimes(1);
  });

  it("dedupes identical URLs and caches the company page across jobs", async () => {
    const jobs = [
      { ...linkedinJob(), url: "https://www.linkedin.com/jobs/view/2" },
      { ...linkedinJob(), url: "https://www.linkedin.com/jobs/view/2" },
      { ...linkedinJob(), url: "https://www.linkedin.com/jobs/view/3" },
    ];

    const results = await verifyJobBatch(jobs);

    expect(results.size).toBe(2);
    expect(mockFetchLinkedInJobPage).toHaveBeenCalledTimes(2);
    expect(mockFetchLinkedInCompanyPage).toHaveBeenCalledTimes(1);
  });
});
