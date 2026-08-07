import type { JobPosting, VerificationResult } from "@/lib/types";
import {
  emptyVerifierCache,
  verifyJob,
  verifyJobBatch,
  type VerifierCache,
} from "@/lib/jobs/verifier";

export interface IngestCounts {
  inserted: number;
  skipped: number;
}

export type JobVerifier = (
  job: JobPosting,
  cache?: VerifierCache,
) => Promise<VerificationResult>;

export interface IngestOptions {
  verify?: boolean | JobVerifier;
}

interface IngestError {
  code?: string;
  message: string;
}

interface JobQuery {
  eq(column: string, value: unknown): JobQuery;
  maybeSingle(): PromiseLike<{
    data: { id: string } | null;
    error: IngestError | null;
  }>;
}

export interface IngestClient {
  from(table: "jobs"): {
    select(columns: string): JobQuery;
    insert(
      values: Record<string, unknown>,
    ): PromiseLike<{ error: IngestError | null }>;
  };
}

export async function ingestJobs(
  client: IngestClient,
  jobs: JobPosting[],
  opts?: IngestOptions,
): Promise<IngestCounts> {
  const doVerify = opts?.verify ?? true;
  const verifier: JobVerifier =
    typeof doVerify === "function"
      ? doVerify
      : (job, cache) => verifyJob(job, cache);

  const pending = jobs.filter(
    (job) => Boolean(job.url) && !job.verified_status && !job.apply_url,
  );

  const verificationByUrl = new Map<string, VerificationResult>();
  if (doVerify && pending.length > 0) {
    if (typeof doVerify === "function") {
      for (const job of pending) {
        const result = await verifier(job).catch(() => null);
        if (result) verificationByUrl.set(job.url ?? "", result);
      }
    } else {
      const batch = await verifyJobBatch(pending, {
        cache: emptyVerifierCache(),
      });
      for (const [url, result] of batch) verificationByUrl.set(url, result);
    }
  }

  let inserted = 0;
  let skipped = 0;

  for (const job of jobs) {
    const source = job.source ?? "feed";
    const verified = verificationByUrl.get(job.url ?? "");
    const payload = {
      source,
      external_id: job.external_id ?? null,
      title: job.title,
      company: job.company ?? "",
      location: job.location ?? "",
      description: job.description ?? "",
      url: job.url ?? "",
      salary_min: job.salary_min ?? null,
      salary_max: job.salary_max ?? null,
      posted_at: job.posted_at ?? null,
      employment_type: job.employment_type ?? null,
      sponsorship: job.sponsorship ?? null,
      apply_url: job.apply_url ?? verified?.apply_url ?? null,
      verified_status: job.verified_status ?? verified?.status ?? null,
      verified_source_url:
        job.verified_source_url ?? verified?.source_url ?? null,
      verified_at: verified ? new Date().toISOString() : (job.verified_at ?? null),
    };

    if (source !== "manual" && job.external_id) {
      const { data: existing } = await client
        .from("jobs")
        .select("id")
        .eq("source", source)
        .eq("external_id", job.external_id)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }
    }

    const { error } = await client.from("jobs").insert(payload);
    if (error) {
      if (error.code === "23505") {
        skipped++;
        continue;
      }
      throw new Error(error.message);
    }
    inserted++;
  }

  return { inserted, skipped };
}
