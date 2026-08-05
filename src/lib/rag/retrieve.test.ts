import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: mockLimit,
        }),
      }),
    }),
  }),
}));

import { retrieveChunks } from "@/lib/rag/retrieve";

const chunks = [
  {
    id: "1",
    profile_id: "p1",
    content_type: "experience",
    content: "Built high-throughput services.",
    source_label: "Experience",
    metadata: {},
  },
];

describe("retrieveChunks without an OpenAI key (fallback path)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mockLimit.mockReset();
  });

  it("returns stored chunks without embedding the query", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    mockLimit.mockResolvedValue({ data: chunks, error: null });

    const result = await retrieveChunks("p1", "any query", 3);

    expect(result).toEqual(chunks);
    expect(mockLimit).toHaveBeenCalledTimes(1);
  });

  it("throws when the database query fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    mockLimit.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(retrieveChunks("p1", "any query")).rejects.toThrow("boom");
  });
});
