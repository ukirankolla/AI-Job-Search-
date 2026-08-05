import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentInput } from "@/lib/types";

const mockComplete = vi.fn();

vi.mock("@/lib/llm/provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm/provider")>();
  return {
    ...actual,
    getChatProvider: () => ({ complete: mockComplete }),
  };
});

import { runMatcher, runTailor, runTracker } from "@/lib/agents/workers";

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
