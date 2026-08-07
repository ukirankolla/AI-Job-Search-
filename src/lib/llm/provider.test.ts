import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getChatProvider, parseJsonObject } from "@/lib/llm/provider";
import { buildGraph } from "@/lib/agents/graph";
import type { AgentInput } from "@/lib/types";

beforeEach(() => vi.stubEnv("OPENAI_API_KEY", ""));
afterEach(() => vi.unstubAllEnvs());

describe("parseJsonObject", () => {
  it("parses plain JSON objects", () => {
    expect(parseJsonObject('{"score": 78, "ok": true}')).toEqual({
      score: 78,
      ok: true,
    });
  });

  it("parses JSON wrapped in markdown json code fences", () => {
    expect(parseJsonObject('```json\n{"score": 78}\n```')).toEqual({
      score: 78,
    });
  });

  it("parses JSON wrapped in generic code fences", () => {
    expect(parseJsonObject('```\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it("ignores surrounding whitespace and newlines", () => {
    expect(parseJsonObject('  \n\n {"score": 90} \n ')).toEqual({ score: 90 });
  });

  it("extracts JSON embedded in prose", () => {
    expect(
      parseJsonObject(
        'Sure! Here is the result:\n{"score": 85, "summary": "Great fit"}\nLet me know if you need more.',
      ),
    ).toEqual({ score: 85, summary: "Great fit" });
  });

  it("extracts the first top-level JSON value", () => {
    expect(parseJsonObject('prefix [1, 2, 3] suffix {"a":1}')).toEqual([1, 2, 3]);
  });

  it("handles braces inside string values", () => {
    expect(parseJsonObject('{"resume": "line {with} braces", "ok": true}')).toEqual(
      { resume: "line {with} braces", ok: true },
    );
  });

  it("tolerates trailing commas", () => {
    expect(
      parseJsonObject('{"skills": ["a", "b",], "score": 5,}'),
    ).toEqual({ skills: ["a", "b"], score: 5 });
  });

  it("returns null for invalid or empty input", () => {
    expect(parseJsonObject("not json")).toBeNull();
    expect(parseJsonObject('{"score":')).toBeNull();
    expect(parseJsonObject("")).toBeNull();
  });
});

describe("mock resume parser", () => {
  it("extracts a profile from resume text", async () => {
    const provider = getChatProvider();
    const system = "You are the RESUME PARSER agent.";
    const user = "RESUME:\nJane Smith\nSenior Full-Stack Engineer\nSkills: TypeScript, React, Node.js";

    const { content } = await provider.complete(system, user);
    const parsed = JSON.parse(content);

    expect(parsed.full_name).toBe("Jane Smith");
    expect(parsed.title).toContain("Engineer");
    expect(parsed.skills).toContain("TypeScript");
  });
});

describe("mock agents", () => {
  const user =
    "JOB:\nTitle: Senior Full-Stack Engineer\nCompany: Acme\n\nDescription: Build web systems with TypeScript, React, and Node.js.\n\nPROFILE:\nName: Jane Smith\nHeadline: Full-Stack Engineer\nSummary: Builds web products end to end.\nSkills: TypeScript, React, Node.js";

  it("returns parseable JSON for the matcher system prompt", async () => {
    const provider = getChatProvider();
    const system =
      "You are the MATCHER agent in a job-search multi-agent system.";
    const { content } = await provider.complete(system, user);
    const parsed = JSON.parse(content);
    expect(typeof parsed.score).toBe("number");
    expect(parsed.score).toBeGreaterThan(0);
  });

  it("returns parseable JSON for the tailor system prompt", async () => {
    const provider = getChatProvider();
    const system =
      "You are the TAILOR agent in a job-search multi-agent system.";
    const { content } = await provider.complete(system, user);
    const parsed = JSON.parse(content);
    expect(typeof parsed.resume).toBe("string");
    expect(parsed.resume.length).toBeGreaterThan(0);
  });

  it("returns parseable JSON for the prep system prompt", async () => {
    const provider = getChatProvider();
    const system =
      "You are the PREP agent in a job-search multi-agent system.";
    const { content } = await provider.complete(system, user);
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed.questions)).toBe(true);
    expect(parsed.questions.length).toBeGreaterThan(0);
  });

  it("returns parseable JSON for the tracker system prompt", async () => {
    const provider = getChatProvider();
    const system =
      "You are the TRACKER agent in a job-search multi-agent system.";
    const { content } = await provider.complete(system, user);
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it("returns a 100% score for the rematch system prompt", async () => {
    const provider = getChatProvider();
    const system =
      "You are the REMATCH agent in a job-search multi-agent system.";
    const rematchUser = `${user}\n\nTAILORED RESUME:\nJane Smith\n### SKILLS\nTypeScript, React, Node.js`;
    const { content } = await provider.complete(system, rematchUser);
    const parsed = JSON.parse(content);
    expect(parsed.score).toBe(100);
    expect(parsed.missing_skills).toEqual([]);
  });

  it("derives the match score from the actual skills in the posting", async () => {
    const provider = getChatProvider();
    const weakUser =
      "JOB:\nTitle: Python Data Engineer\nCompany: Acme\n\nDescription: Work with Python, Pandas, TensorFlow, and Kafka.\n\nPROFILE:\nName: Jane Smith\nHeadline: Frontend Engineer\nSummary: Builds UIs with React.\nSkills: TypeScript, React";
    const { content } = await provider.complete(
      "You are the MATCHER agent in a job-search multi-agent system.",
      weakUser,
    );
    const parsed = JSON.parse(content);
    expect(parsed.score).toBeLessThan(50);
    expect(parsed.missing_skills).toContain("Python");
  });
});

describe("mock profile field parsing", () => {
  it("does not leak an empty Summary field into the next line", async () => {
    const provider = getChatProvider();
    const user =
      "JOB:\nTitle: Data Engineer\nCompany: Optomi\n\nDescription: Work with Python and Spark.\n\nPROFILE:\nName: Jane Smith\nHeadline: Data Engineer\nSummary: \nSkills: Python, Spark";
    const { content } = await provider.complete(
      "You are the TAILOR agent in a job-search multi-agent system.",
      user,
    );
    const parsed = JSON.parse(content);
    expect(parsed.resume).not.toContain("Skills:");
    expect(parsed.resume).toContain("specializing in");
    expect(parsed.resume).toContain("Tailored for the Data Engineer at Optomi");
  });

  it("builds a complete resume from RAG chunks without section headers", async () => {
    const provider = getChatProvider();
    const user =
      "JOB:\nTitle: Data Engineer\nCompany: Optomi\n\nDescription: Work with Python, Spark, and Kafka.\n\nPROFILE:\nName: Jane Smith\nHeadline: Data Engineer\nSummary: Builds data pipelines.\nSkills: Python\n\n--- Relevant resume excerpts (RAG) ---\n[Experience]\nQA Automation Engineer at Optomi\nAutomated end-to-end test suites.\n\n[Skills]\nPython, Spark, SQL";
    const { content } = await provider.complete(
      "You are the TAILOR agent in a job-search multi-agent system.",
      user,
    );
    const parsed = JSON.parse(content);
    expect(parsed.resume).toContain("QA Automation Engineer");
    expect(parsed.resume).toContain("Python, Spark, SQL");
    expect(parsed.resume).not.toContain("--- Relevant resume excerpts (RAG) ---");
    expect(parsed.resume).not.toMatch(/Summary: \n/);
    expect(parsed.resume).toContain("Tailored for the Data Engineer at Optomi");
  });

  it("falls back to a placeholder name instead of stealing the Headline line", async () => {
    const provider = getChatProvider();
    const user =
      "JOB:\nTitle: Data Engineer\nCompany: Optomi\n\nDescription: Work with Python.\n\nPROFILE:\nName: \nHeadline: Data Engineer\nSummary: Builds data pipelines.\nSkills: Python, Spark";
    const { content } = await provider.complete(
      "You are the TAILOR agent in a job-search multi-agent system.",
      user,
    );
    const parsed = JSON.parse(content);
    expect(parsed.cover_letter).toContain("[Your Name]");
    expect(parsed.cover_letter).not.toContain("Headline:");
  });
});

describe("mock apply graph end to end", () => {
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
      description: "Build distributed web systems with TypeScript.",
    },
  };

  it("matches, tailors, re-matches at 100%, and prepares questions", async () => {
    const state = await buildGraph("apply").invoke({ input });

    expect(state.match?.score).toBe(100);
    expect(state.tailor?.resume).toBeDefined();
    expect(state.tailor?.resume.length).toBeGreaterThan(0);
    expect(state.prep?.questions.length).toBe(2);
    expect(state.error).toBeNull();
  });
});
