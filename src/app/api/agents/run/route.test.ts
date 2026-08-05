import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSseBuffer } from "@/lib/sse";
import type { AgentInput } from "@/lib/types";

const {
  mockRequireUser,
  mockComplete,
  mockLoadAgentInput,
  mockCreateAdmin,
} = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
  mockComplete: vi.fn(),
  mockLoadAgentInput: vi.fn(),
  mockCreateAdmin: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireUser: mockRequireUser }));

vi.mock("@/lib/llm/provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm/provider")>();
  return {
    ...actual,
    getChatProvider: () => ({ complete: mockComplete }),
  };
});

vi.mock("@/lib/services/agentService", () => ({
  loadAgentInput: mockLoadAgentInput,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdmin,
}));

import { POST } from "@/app/api/agents/run/route";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const JOB_ID = "22222222-2222-2222-2222-222222222222";
const APP_ID = "33333333-3333-3333-3333-333333333333";
const RUN_ID = "44444444-4444-4444-4444-444444444444";

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
  summary: "Strong overlap.",
  matched_skills: ["TypeScript"],
  missing_skills: [],
  strengths: [],
  concerns: [],
});

function fakeChain(overrides: { owned?: boolean; runId?: string }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    maybeSingle: async () =>
      overrides.owned === false
        ? { data: null, error: null }
        : { data: { id: APP_ID }, error: null },
    single: async () => ({ data: { id: overrides.runId ?? RUN_ID }, error: null }),
  };
  return chain;
}

function fakeAdmin(overrides?: { owned?: boolean; runId?: string }) {
  return { from: () => fakeChain(overrides ?? {}) };
}

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/agents/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function collectEvents(res: Response) {
  const text = await res.text();
  return parseSseBuffer(text, "").events;
}

describe("POST /api/agents/run", () => {
  beforeEach(() => {
    mockRequireUser.mockReset();
    mockComplete.mockReset();
    mockLoadAgentInput.mockReset();
    mockCreateAdmin.mockReset();
    mockRequireUser.mockResolvedValue({ id: USER_ID });
    mockComplete.mockResolvedValue({ content: matchJson });
    mockLoadAgentInput.mockResolvedValue(input);
    mockCreateAdmin.mockReturnValue(fakeAdmin());
  });

  it("streams meta, a matcher step, and a done event with results", async () => {
    const res = await post({ jobId: JOB_ID, runType: "analyze" });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const events = await collectEvents(res);
    const names = events.map((e) => e.event);

    expect(names).toContain("meta");
    expect(names).toContain("step");
    expect(names).toContain("done");

    const step = events.find((e) => e.event === "step")!;
    expect(JSON.parse(step.data).agent).toBe("matcher");
    expect(JSON.parse(step.data).status).toBe("completed");

    const done = events.find((e) => e.event === "done")!;
    expect(JSON.parse(done.data).results.match.score).toBe(88);
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it("defaults runType to analyze", async () => {
    const res = await post({ jobId: JOB_ID });

    expect(res.status).toBe(200);
    const events = await collectEvents(res);
    expect(events.some((e) => e.event === "done")).toBe(true);
  });

  it("persists the match result when an application is attached", async () => {
    const res = await post({ jobId: JOB_ID, applicationId: APP_ID, runType: "analyze" });

    expect(res.status).toBe(200);
    const events = await collectEvents(res);
    expect(events.some((e) => e.event === "done")).toBe(true);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockRejectedValue(new Error("Unauthorized"));

    const res = await post({ jobId: JOB_ID });
    expect(res.status).toBe(401);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload", async () => {
    const res = await post({ runType: "analyze" });
    expect(res.status).toBe(400);
  });

  it("returns 403 when the application is not owned by the user", async () => {
    mockCreateAdmin.mockReturnValue(fakeAdmin({ owned: false }));

    const res = await post({ jobId: JOB_ID, applicationId: APP_ID });
    expect(res.status).toBe(403);
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
