import { beforeEach, describe, expect, it, vi } from "vitest";
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

import { POST } from "@/app/api/jobs/match/route";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const JOB_ID = "00000000-0000-4000-8000-000000000002";

const matchJson = JSON.stringify({
  score: 88,
  summary: "Great fit for this role.",
  matched_skills: ["react", "typescript"],
  missing_skills: ["graphql"],
  strengths: [],
  concerns: [],
});

function fakeAdmin({ hasResume = true }: { hasResume?: boolean } = {}) {
  return {
    from(table: string) {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: hasResume
                  ? { resume_text: "Full stack engineer with 4 years experience." }
                  : { resume_text: "" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "job_matches") {
        return {
          upsert: async () => ({ data: null, error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

async function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/jobs/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const input: AgentInput = {
  profile: {
    id: USER_ID,
    full_name: "Test User",
    title: "Full Stack Engineer",
    summary: "Engineer",
    skills: ["react", "typescript"],
    resume_text: "resume",
    resume_embedding_status: "done",
    created_at: "",
    updated_at: "",
  },
  chunks: [],
  job: {
    id: JOB_ID,
    title: "Frontend Engineer",
    company: "Acme",
    description: "React + TypeScript",
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  mockRequireUser.mockResolvedValue({ id: USER_ID });
  mockComplete.mockResolvedValue({ content: matchJson });
  mockLoadAgentInput.mockResolvedValue(input);
  mockCreateAdmin.mockReturnValue(fakeAdmin());
});

describe("POST /api/jobs/match", () => {
  it("scores jobs against the resume and persists matches", async () => {
    const res = await post({ jobIds: [JOB_ID] });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ matched: 1, failed: 0 });
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockRejectedValue(new Error("no session"));
    const res = await post({ jobIds: [JOB_ID] });
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid payload", async () => {
    const res = await post({ jobIds: "not-an-array" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when the user has no resume", async () => {
    mockCreateAdmin.mockReturnValue(fakeAdmin({ hasResume: false }));
    const res = await post({ jobIds: [JOB_ID] });
    expect(res.status).toBe(400);
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
