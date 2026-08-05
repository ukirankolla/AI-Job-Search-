import { describe, expect, it } from "vitest";
import { getChatProvider, parseJsonObject } from "@/lib/llm/provider";

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
