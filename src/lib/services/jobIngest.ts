import type { JobPosting } from "@/lib/types";

export interface IngestCounts {
  inserted: number;
  skipped: number;
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
): Promise<IngestCounts> {
  let inserted = 0;
  let skipped = 0;

  for (const job of jobs) {
    const source = job.source ?? "feed";
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
