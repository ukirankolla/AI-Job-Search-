import type { JobPosting } from "@/lib/types";
import { searchLinkedInJobs } from "@/lib/jobs/linkedin";
import { adzunaSource } from "@/lib/jobs/adzuna";
import { getJobSource } from "@/lib/jobs/sources";

export interface JobSearchParams {
  query?: string;
  hours?: number | null;
  employmentTypes?: string[];
  location?: string;
}

export interface JobSearchOutcome {
  jobs: JobPosting[];
  sources: string[];
  warnings: string[];
}

interface JobSearchProvider {
  name: string;
  fetch(
    params: JobSearchParams,
    opts?: { signal?: AbortSignal },
  ): Promise<JobPosting[]>;
}

/**
 * Enables every free, legitimate source that is configured for this deploy:
 * LinkedIn always, Adzuna (aggregated company career sites) when its keys are
 * set, and a configured company board (Greenhouse/Lever/Ashby/Workable) when
 * JOB_SOURCE is set. Google, Indeed, Dice, and ZipRecruiter expose no free
 * public API, so they are not included.
 */
export function getSearchProviders(): JobSearchProvider[] {
  const providers: JobSearchProvider[] = [
    {
      name: "linkedin",
      fetch: (params, opts) => searchLinkedInJobs(params, opts),
    },
  ];

  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    const adzuna = adzunaSource();
    providers.push({
      name: adzuna.name,
      fetch: (params, opts) => adzuna.fetch(params, opts),
    });
  }

  const boardName = process.env.JOB_SOURCE;
  if (boardName) {
    const board = getJobSource(boardName);
    providers.push({
      name: board.name,
      fetch: (params, opts) => board.fetchRecentJobs(params.hours ?? 24, opts),
    });
  }

  return providers;
}

function normalizeUrl(url: string | undefined | null): string {
  if (!url) return "";
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

export function dedupeJobs(jobs: JobPosting[]): JobPosting[] {
  const seen = new Set<string>();
  const out: JobPosting[] = [];
  for (const job of jobs) {
    const key = normalizeUrl(job.url) || `${job.source ?? ""}:${job.external_id ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

export async function searchJobs(
  params: JobSearchParams,
  opts?: { signal?: AbortSignal },
): Promise<JobSearchOutcome> {
  const providers = getSearchProviders();
  const settled = await Promise.allSettled(
    providers.map((p) => p.fetch(params, opts)),
  );

  const jobs: JobPosting[] = [];
  const sources: string[] = [];
  const warnings: string[] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      if (result.value.length > 0) sources.push(providers[i].name);
      jobs.push(...result.value);
    } else {
      warnings.push(
        `${providers[i].name}: ${(result.reason as Error).message}`,
      );
    }
  });

  return { jobs: dedupeJobs(jobs), sources, warnings };
}
