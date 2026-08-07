import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getChatProvider, parseJsonObject } from "@/lib/llm/provider";

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
    "JOB:\nTitle: Senior Full-Stack Engineer\nCompany: Acme\n\nDescription: Build web systems with TypeScript.\n\nPROFILE:\nJane Smith\nSkills: TypeScript, React, Node.js";

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
});
