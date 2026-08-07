import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentInput, VerifierInput } from "@/lib/types";

const mockComplete = vi.fn();

vi.mock("@/lib/llm/provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm/provider")>();
  return {
    ...actual,
    getChatProvider: () => ({ complete: mockComplete }),
  };
});

import { runMatcher, runTailor, runTracker, parseResume, runVerifier } from "@/lib/agents/workers";

const input: AgentInput = {
  profile: {
    id: "p1",
    full_name: "Jane Smith",
    title: "Full-Stack Engineer",
    summary: "Builds web products end to end.",
    skills: ["TypeScript", "React", "Node.js"],
    resume_text: "",
    resume_embedding_status: "done",
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  chunks: [],
  job: {
    title: "Senior Full-Stack Engineer",
    company: "Acme",
    location: "Remote",
    description: "Build distributed web systems.",
  },
};

describe("runMatcher", () => {
  beforeEach(() => {
    mockComplete.mockReset();
  });

  it("returns a score clamped to the 0-100 range", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        score: 150,
        summary: "Great fit.",
        matched_skills: ["TypeScript"],
        missing_skills: [],
        strengths: [],
        concerns: [],
      }),
    });

    const result = await runMatcher(input);
    expect(result.score).toBe(100);
  });

  it("clamps negative scores up to 0", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        score: -20,
        summary: "Weak fit.",
        matched_skills: [],
        missing_skills: ["Kubernetes"],
        strengths: [],
        concerns: [],
      }),
    });

    const result = await runMatcher(input);
    expect(result.score).toBe(0);
  });

  it("falls back to defaults when fields are missing or invalid", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({ score: "high", summary: "Only summary." }),
    });

    const result = await runMatcher(input);
    expect(result).toEqual({
      score: 0,
      summary: "Only summary.",
      matched_skills: [],
      missing_skills: [],
      strengths: [],
      concerns: [],
    });
  });

  it("uses defaults when the LLM output is not valid JSON", async () => {
    mockComplete.mockResolvedValue({ content: "not json at all" });

    const result = await runMatcher(input);
    expect(result).toEqual({
      score: 0,
      summary: "No summary provided.",
      matched_skills: [],
      missing_skills: [],
      strengths: [],
      concerns: [],
    });
  });
});

describe("runTailor", () => {
  beforeEach(() => {
    mockComplete.mockReset();
  });

  it("parses the tailored resume and cover letter", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        resume: "### SUMMARY\nJane is a senior engineer.",
        cover_letter: "Dear Acme,",
        highlights: ["Repositioned bullets"],
      }),
    });

    const result = await runTailor(input);
    expect(result.resume).toContain("Jane is a senior engineer");
    expect(result.cover_letter).toContain("Dear Acme");
    expect(result.highlights).toEqual(["Repositioned bullets"]);
  });

  it("falls back to defaults when output is invalid", async () => {
    mockComplete.mockResolvedValue({ content: "nope" });

    const result = await runTailor(input);
    expect(result.resume).toBe("No resume generated.");
    expect(result.cover_letter).toBe("No cover letter generated.");
    expect(result.highlights).toEqual([]);
  });
});

describe("runTracker", () => {
  beforeEach(() => {
    mockComplete.mockReset();
  });

  it("returns parsed tasks", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify([
        { title: "Follow up on interview", priority: "high", reason: "Soon." },
        { title: "Update portfolio", priority: "low", reason: "Stale." },
      ]),
    });

    const tasks = await runTracker("context");
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toEqual({
      title: "Follow up on interview",
      priority: "high",
      reason: "Soon.",
    });
  });

  it("drops entries without a title", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify([
        { priority: "high", reason: "No title here." },
        { title: "Send thank-you note", priority: "medium", reason: "Polite." },
      ]),
    });

    const tasks = await runTracker("context");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Send thank-you note");
  });

  it("returns an empty array for invalid JSON or non-array output", async () => {
    mockComplete.mockResolvedValue({ content: "not json" });
    expect(await runTracker("context")).toEqual([]);

    mockComplete.mockResolvedValue({ content: JSON.stringify({ title: "x" }) });
    expect(await runTracker("context")).toEqual([]);
  });
});

describe("runVerifier", () => {
  beforeEach(() => {
    mockComplete.mockReset();
  });

  const input: VerifierInput = {
    title: "Senior Engineer",
    company: "Acme",
    location: "Remote",
    source: "linkedin",
    posting_url: "https://www.linkedin.com/jobs/view/123",
    candidate_apply_url: "https://careers.acme.com",
    candidate_source_url: "https://careers.acme.com",
    company_page_excerpt: "Acme careers",
  };

  it("normalizes a verified verdict with its URLs and confidence", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        status: "verified",
        confidence: 98,
        apply_url: "https://careers.acme.com/jobs/9",
        source_url: "https://careers.acme.com",
        reason: "Posting confirmed on the ATS.",
      }),
    });

    const result = await runVerifier(input);
    expect(result).toEqual({
      status: "verified",
      confidence: 98,
      apply_url: "https://careers.acme.com/jobs/9",
      source_url: "https://careers.acme.com",
      reason: "Posting confirmed on the ATS.",
    });
  });

  it("rejects LinkedIn apply URLs and falls back to the candidate", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        status: "verified",
        confidence: 90,
        apply_url: "https://www.linkedin.com/jobs/view/999",
        source_url: "https://careers.acme.com",
        reason: "Found it.",
      }),
    });

    const result = await runVerifier(input);
    expect(result.status).toBe("verified");
    expect(result.apply_url).toBe(input.candidate_apply_url);
  });

  it("empties URLs when the agent says unverified", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        status: "unverified",
        confidence: 10,
        apply_url: "https://www.linkedin.com/jobs/view/123",
        source_url: "https://careers.acme.com",
        reason: "Not on the company site.",
      }),
    });

    const result = await runVerifier(input);
    expect(result.status).toBe("unverified");
    expect(result.apply_url).toBe("");
    expect(result.source_url).toBe("");
  });

  it("defaults to unverified with empty URLs for invalid output", async () => {
    mockComplete.mockResolvedValue({ content: "not json at all" });

    const result = await runVerifier(input);
    expect(result).toEqual({
      status: "unverified",
      confidence: 0,
      apply_url: "",
      source_url: "",
      reason: "No company-owned posting found.",
    });
  });
});

describe("parseResume", () => {
  beforeEach(() => {
    mockComplete.mockReset();
  });

  it("parses the extracted profile fields", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        full_name: "Jane Smith",
        title: "Senior Full-Stack Engineer",
        summary: "Ships web products end to end.",
        skills: ["TypeScript", "React"],
      }),
    });

    const result = await parseResume("Jane Smith\nSenior Engineer\n...");
    expect(result).toEqual({
      full_name: "Jane Smith",
      title: "Senior Full-Stack Engineer",
      summary: "Ships web products end to end.",
      skills: ["TypeScript", "React"],
    });
  });

  it("falls back to empty values when output is invalid", async () => {
    mockComplete.mockResolvedValue({ content: "not json" });

    expect(await parseResume("resume text")).toEqual({
      full_name: "",
      title: "",
      summary: "",
      skills: [],
    });
  });

  it("coerces malformed skills into an empty array", async () => {
    mockComplete.mockResolvedValue({
      content: JSON.stringify({ full_name: "Jane Smith", skills: "React" }),
    });

    const result = await parseResume("resume text");
    expect(result.full_name).toBe("Jane Smith");
    expect(result.skills).toEqual([]);
  });
});
