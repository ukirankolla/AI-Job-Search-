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

import { buildGraph } from "@/lib/agents/graph";

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

const matchJson = JSON.stringify({
  score: 88,
  summary: "Strong overlap with React and Node.js.",
  matched_skills: ["TypeScript", "React", "Node.js"],
  missing_skills: [],
  strengths: ["Full-stack depth"],
  concerns: [],
});

const tailorJson = JSON.stringify({
  resume: "### SUMMARY\nJane is a senior engineer.",
  cover_letter: "Dear Acme,",
  highlights: ["Repositioned bullets"],
});

const prepJson = JSON.stringify({
  summary: "Focus on system design.",
  questions: [{ question: "Tell me about a hard bug.", answer: "…", tip: "STAR" }],
  tips: ["Study React internals."],
});

async function runGraph(runType: "analyze" | "apply" | "prep") {
  return buildGraph(runType).invoke({ input });
}

describe("buildGraph orchestration", () => {
  beforeEach(() => {
    mockComplete.mockReset();
  });

  it("analyze runs the matcher only and stops", async () => {
    mockComplete.mockResolvedValue({ content: matchJson });

    const state = await runGraph("analyze");

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(state.match?.score).toBe(88);
    expect(state.tailor).toBeNull();
    expect(state.prep).toBeNull();
    expect(state.error).toBeNull();
    expect(state.steps).toEqual([
      expect.objectContaining({ agent: "matcher", status: "completed" }),
    ]);
  });

  it("apply chains matcher, tailor, and prep", async () => {
    mockComplete
      .mockResolvedValueOnce({ content: matchJson })
      .mockResolvedValueOnce({ content: tailorJson })
      .mockResolvedValueOnce({ content: prepJson });

    const state = await runGraph("apply");

    expect(mockComplete).toHaveBeenCalledTimes(3);
    expect(state.match?.score).toBe(88);
    expect(state.tailor?.resume).toContain("Jane is a senior engineer");
    expect(state.tailor?.cover_letter).toBe("Dear Acme,");
    expect(state.prep?.questions).toHaveLength(1);
    expect(state.error).toBeNull();
    expect(
      state.steps.map((s: { agent: string }) => s.agent),
    ).toEqual(["matcher", "tailor", "prep"]);
  });

  it("prep also runs the full chain", async () => {
    mockComplete
      .mockResolvedValueOnce({ content: matchJson })
      .mockResolvedValueOnce({ content: tailorJson })
      .mockResolvedValueOnce({ content: prepJson });

    const state = await runGraph("prep");

    expect(mockComplete).toHaveBeenCalledTimes(3);
    expect(state.match?.score).toBe(88);
    expect(state.tailor?.resume).toBeDefined();
    expect(state.prep?.summary).toBe("Focus on system design.");
  });

  it("short-circuits to END when the matcher fails", async () => {
    mockComplete.mockRejectedValue(new Error("provider down"));

    const state = await runGraph("apply");

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(state.match).toBeNull();
    expect(state.tailor).toBeNull();
    expect(state.prep).toBeNull();
    expect(state.error).toBe("provider down");
    expect(state.steps).toEqual([
      expect.objectContaining({ agent: "matcher", status: "failed" }),
    ]);
  });
});
