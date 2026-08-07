import { describe, expect, it, vi } from "vitest";
import type { JobPosting, VerificationResult } from "@/lib/types";
import {
  ingestJobs,
  type IngestClient,
  type JobVerifier,
} from "@/lib/services/jobIngest";

function makeClient() {
  const inserts: Record<string, unknown>[] = [];
  const eqChain = {
    eq: () => eqChain,
    maybeSingle: async () => ({ data: null, error: null }),
  };
  const client: IngestClient = {
    from() {
      return {
        select: () => eqChain,
        insert: async (values) => {
          inserts.push(values);
          return { error: null };
        },
      };
    },
  };
  return { client, inserts };
}

function job(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    title: "Senior Engineer",
    company: "Acme",
    description: "",
    url: "https://www.linkedin.com/jobs/view/123",
    ...overrides,
  };
}

const verdict: VerificationResult = {
  status: "verified",
  confidence: 95,
  apply_url: "https://careers.acme.com/jobs/9",
  source_url: "https://careers.acme.com",
  reason: "On the company site.",
};

describe("ingestJobs", () => {
  it("persists the verifier's verdict and apply URL", async () => {
    const { client, inserts } = makeClient();
    const verify = vi.fn().mockResolvedValue(verdict) as unknown as JobVerifier;

    const counts = await ingestJobs(client, [job()], { verify });

    expect(counts.inserted).toBe(1);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(inserts[0].apply_url).toBe("https://careers.acme.com/jobs/9");
    expect(inserts[0].verified_status).toBe("verified");
    expect(inserts[0].verified_source_url).toBe("https://careers.acme.com");
    expect(inserts[0].verified_at).toBeTruthy();
  });

  it("skips verification for jobs that already carry verification fields", async () => {
    const { client, inserts } = makeClient();
    const verify = vi.fn();

    await ingestJobs(
      client,
      [
        job({
          verified_status: "likely",
          apply_url: "https://careers.acme.com",
        }),
      ],
      { verify: verify as unknown as JobVerifier },
    );

    expect(verify).not.toHaveBeenCalled();
    expect(inserts[0].apply_url).toBe("https://careers.acme.com");
    expect(inserts[0].verified_status).toBe("likely");
  });

  it("prefers explicit job fields over verifier results", async () => {
    const { client, inserts } = makeClient();
    const verify = vi.fn().mockResolvedValue(verdict) as unknown as JobVerifier;

    await ingestJobs(
      client,
      [
        job({
          verified_status: "unverified",
          verified_source_url: "https://acme.com",
        }),
      ],
      { verify },
    );

    expect(verify).not.toHaveBeenCalled();
    expect(inserts[0].verified_status).toBe("unverified");
    expect(inserts[0].verified_source_url).toBe("https://acme.com");
    expect(inserts[0].apply_url).toBeNull();
  });

  it("does not verify when disabled", async () => {
    const { client, inserts } = makeClient();
    const verify = vi.fn();

    await ingestJobs(client, [job()], {
      verify: false,
    });

    expect(verify).not.toHaveBeenCalled();
    expect(inserts[0].verified_status).toBeNull();
    expect(inserts[0].apply_url).toBeNull();
  });

  it("ignores verifier failures instead of failing the insert", async () => {
    const { client, inserts } = makeClient();
    const verify = vi
      .fn()
      .mockRejectedValue(new Error("boom")) as unknown as JobVerifier;

    const counts = await ingestJobs(client, [job()], { verify });

    expect(counts.inserted).toBe(1);
    expect(inserts[0].verified_status).toBeNull();
    expect(inserts[0].apply_url).toBeNull();
  });
});
