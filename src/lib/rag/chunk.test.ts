import { describe, expect, it } from "vitest";
import { chunkResume } from "@/lib/rag/chunk";

describe("chunkResume", () => {
  it("returns an empty array for empty or whitespace-only input", () => {
    expect(chunkResume("")).toEqual([]);
    expect(chunkResume("  \n\n  ")).toEqual([]);
  });

  it("labels chunks by section heading", () => {
    const resume = [
      "Jane Smith",
      "Backend Engineer",
      "",
      "Summary",
      "Distributed systems engineer.",
      "",
      "Skills",
      "Go, PostgreSQL, Kubernetes",
      "",
      "Experience",
      "Built high-throughput services.",
    ].join("\n");

    const chunks = chunkResume(resume);
    const byContent = (text: string) =>
      chunks.find((c) => c.content.includes(text));

    expect(byContent("Distributed systems engineer.")?.content_type).toBe(
      "summary",
    );
    expect(byContent("Go, PostgreSQL, Kubernetes")?.content_type).toBe(
      "skills",
    );
    expect(byContent("Built high-throughput services.")?.content_type).toBe(
      "experience",
    );
  });

  it("keeps the heading text as the source label", () => {
    const chunks = chunkResume("Projects\nBuilt a dashboard.");
    expect(chunks[0]?.source_label).toBe("Projects");
  });

  it("defaults unrecognized sections to experience", () => {
    const chunks = chunkResume("Awards\nBest engineer 2024");
    expect(chunks[0]?.content_type).toBe("experience");
  });

  it("splits very long sections into multiple chunks", () => {
    const longLine = "Bullet point about delivering value and impact. ".repeat(
      60,
    );
    const lines = Array.from({ length: 20 }, () => longLine);
    const chunks = chunkResume(["Experience", ...lines].join("\n"));

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.content.length > 0)).toBe(true);
  });
});
