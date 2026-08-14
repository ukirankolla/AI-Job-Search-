import type { JobPosting } from "@/lib/types";

/**
 * Adzuna aggregates postings pulled from many companies' own career sites
 * (Greenhouse, Workday, Lever, SmartRecruiters, and hundreds more). Free API
 * key requires an Adzuna developer account; the `us` country code scopes
 * results to the United States.
 */

interface AdzunaResult {
  id?: string;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url?: string;
  created?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  contract_type?: string;
  contract_time?: string;
}

export interface AdzunaSearchParams {
  query?: string;
  hours?: number | null;
  employmentTypes?: string[];
  location?: string;
}

export function mapAdzunaEmploymentType(
  type: string | undefined | null,
): string | null {
  const v = (type ?? "").toLowerCase();
  if (v.includes("intern")) return "internship";
  if (v.includes("contract") || v.includes("temp")) return "c2c";
  if (v.includes("perm") || v.includes("full")) return "full_time";
  if (v.includes("w2")) return "w2";
  // Fallback: unknown types return null
  return null;
}

/**
 * Determines if a job matches the requested employment types.
 * If no types specified, all jobs match.
 */
export function matchesEmploymentType(
  jobType: string | null,
  requestedTypes: string[] | undefined,
): boolean {
  if (!requestedTypes || requestedTypes.length === 0) return true;
  return requestedTypes.includes(jobType || "");
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildAdzunaSearchUrl(
  params: AdzunaSearchParams & { appId: string; appKey: string },
): string {
  const sp = new URLSearchParams({
    app_id: params.appId,
    app_key: params.appKey,
    "results_per_page": "25",
    max_days_old: String(Math.max(1, Math.ceil((params.hours ?? 24) / 24))),
  });
  const query = params.query?.trim();
  if (query) sp.set("what", query);
  const location = params.location?.trim();
  if (location && location.toLowerCase() !== "united states") {
    sp.set("where", location);
  }
  // Note: All employment type filtering is done client-side (matchesEmploymentType)
  // Adzuna API only supports full_time=1, but we get more results without filters
  // and filter by contract_time field in mapAdzunaJobs
  return `https://api.adzuna.com/v1/api/jobs/us/search/1?${sp.toString()}`;
}

export function mapAdzunaJobs(
  results: AdzunaResult[],
  requestedTypes?: string[],
): JobPosting[] {
  const out: JobPosting[] = [];
  for (const r of results) {
    if (!r.title || !r.redirect_url) continue;
    const employment_type = mapAdzunaEmploymentType(r.contract_time);
    // Filter by employment type if specified
    if (!matchesEmploymentType(employment_type, requestedTypes)) continue;
    out.push({
      source: "adzuna",
      external_id: r.id ? `adzuna-${r.id}` : r.redirect_url,
      title: r.title,
      company: r.company?.display_name ?? "",
      location: r.location?.display_name ?? "",
      description: stripHtml(r.description ?? ""),
      url: r.redirect_url,
      salary_min: r.salary_min ?? null,
      salary_max: r.salary_max ?? null,
      posted_at: r.created ?? null,
      employment_type,
      sponsorship: null,
    });
  }
  return out;
}

export function adzunaSource() {
  return {
    name: "adzuna",
    async fetch(
      params: AdzunaSearchParams,
      opts?: { signal?: AbortSignal },
    ): Promise<JobPosting[]> {
      const appId = process.env.ADZUNA_APP_ID;
      const appKey = process.env.ADZUNA_APP_KEY;
      if (!appId || !appKey) return [];
      const res = await fetch(buildAdzunaSearchUrl({ ...params, appId, appKey }), {
        headers: { Accept: "application/json" },
        signal: opts?.signal,
        next: { revalidate: 0 },
      });
      if (res.status === 429) {
        throw new Error("Adzuna is rate-limiting requests. Wait a minute and try again.");
      }
      if (!res.ok) {
        throw new Error(`Adzuna request failed with status ${res.status}.`);
      }
      const data = (await res.json()) as { results?: AdzunaResult[] };
      // Filter by employment types client-side
      return mapAdzunaJobs(data.results ?? [], params.employmentTypes);
    },
  };
}
