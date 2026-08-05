import type { JobPosting } from "@/lib/types";

const HOUR_MS = 60 * 60 * 1000;

export type JobSourceName = "adzuna" | "usajobs" | "mock";

export interface JobSource {
  name: JobSourceName;
  fetchRecentJobs(
    hours: number,
    opts?: { signal?: AbortSignal },
  ): Promise<JobPosting[]>;
}

export function isPostedWithinHours(
  iso: string | undefined | null,
  hours: number,
  now = new Date(),
): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age >= 0 && age <= hours * HOUR_MS;
}

// ---------------------------------------------------------------------------
// Adzuna (US market)
// ---------------------------------------------------------------------------

interface AdzunaResult {
  id?: string;
  title?: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  contract_type?: string;
}

export function mapAdzunaJobs(
  raw: { results?: AdzunaResult[] },
  hours: number,
  now = new Date(),
): JobPosting[] {
  const out: JobPosting[] = [];
  for (const r of raw.results ?? []) {
    if (!r.id || !r.title || !isPostedWithinHours(r.created, hours, now)) {
      continue;
    }
    out.push({
      source: "adzuna",
      external_id: r.id,
      title: r.title,
      company: r.company?.display_name ?? "",
      location: r.location?.display_name ?? "",
      description: r.description ?? "",
      url: r.redirect_url ?? "",
      salary_min: r.salary_min ?? null,
      salary_max: r.salary_max ?? null,
      posted_at: r.created ?? null,
      employment_type: r.contract_type === "permanent" ? "full_time" : null,
      sponsorship: null,
    });
  }
  return out;
}

export function adzunaSource(): JobSource {
  return {
    name: "adzuna",
    async fetchRecentJobs(hours, opts) {
      const appId = process.env.ADZUNA_APP_ID;
      const appKey = process.env.ADZUNA_APP_KEY;
      if (!appId || !appKey) return [];
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: "50",
        sort_by: "date",
        "content-type": "application/json",
      });
      const res = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`,
        { signal: opts?.signal },
      );
      if (!res.ok) {
        throw new Error(`Adzuna request failed: ${res.status}`);
      }
      return mapAdzunaJobs(await res.json(), hours);
    },
  };
}

// ---------------------------------------------------------------------------
// USAJobs (usajobs.gov)
// ---------------------------------------------------------------------------

interface UsaJobsItem {
  MatchedObjectId?: string;
  MatchedObjectDescriptor?: {
    PositionTitle?: string;
    PositionStartDate?: string;
    OrganizationName?: string;
    PositionLocation?: Array<{ LocationName?: string }>;
    JobSummary?: string;
    ApplyURI?: Array<{ url?: string }>;
    PositionRemuneration?: Array<{
      MinimumRange?: number;
      MaximumRange?: number;
    }>;
  };
}

export function mapUsaJobsJobs(
  raw: { SearchResult?: { SearchResultItems?: UsaJobsItem[] } },
  hours: number,
  now = new Date(),
): JobPosting[] {
  const out: JobPosting[] = [];
  for (const item of raw.SearchResult?.SearchResultItems ?? []) {
    const d = item.MatchedObjectDescriptor;
    if (!d?.PositionTitle || !isPostedWithinHours(d.PositionStartDate, hours, now)) {
      continue;
    }
    const location = (d.PositionLocation ?? [])
      .map((l) => l.LocationName)
      .filter((x): x is string => Boolean(x))
      .join(", ");
    const pay = d.PositionRemuneration?.[0];
    out.push({
      source: "usajobs",
      external_id: item.MatchedObjectId,
      title: d.PositionTitle,
      company: d.OrganizationName ?? "",
      location,
      description: d.JobSummary ?? "",
      url: d.ApplyURI?.[0]?.url ?? "",
      salary_min: pay?.MinimumRange ?? null,
      salary_max: pay?.MaximumRange ?? null,
      posted_at: d.PositionStartDate ?? null,
      employment_type: null,
      sponsorship: null,
    });
  }
  return out;
}

export function usajobsSource(): JobSource {
  return {
    name: "usajobs",
    async fetchRecentJobs(hours, opts) {
      const email = process.env.USAJOBS_EMAIL;
      const key = process.env.USAJOBS_KEY;
      if (!email || !key) return [];
      const res = await fetch(
        "https://data.usajobs.gov/api/search?ResultsPerPage=50&SortField=PositionOpenDate&SortDirection=Desc",
        {
          headers: {
            Host: "data.usajobs.gov",
            "User-Agent": email,
            "Authorization-Key": key,
            "Content-Type": "application/json",
          },
          signal: opts?.signal,
        },
      );
      if (!res.ok) {
        throw new Error(`USAJobs request failed: ${res.status}`);
      }
      return mapUsaJobsJobs(await res.json(), hours);
    },
  };
}

// ---------------------------------------------------------------------------
// Mock (no keys needed — deterministic sample postings)
// ---------------------------------------------------------------------------

const MOCK_LISTINGS: Array<{
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min: number;
  salary_max: number;
  url: string;
  employment_type: string;
  sponsorship: string;
}> = [
  {
    title: "Frontend Engineer",
    company: "Acme Software",
    location: "Austin, TX",
    description:
      "Build React and Next.js web applications. 3+ years of TypeScript experience required.",
    salary_min: 110000,
    salary_max: 140000,
    url: "https://www.linkedin.com/jobs/view/101",
    employment_type: "full_time",
    sponsorship: "yes",
  },
  {
    title: "Senior Full-Stack Developer",
    company: "Northwind Labs",
    location: "Remote (US)",
    description:
      "Full-stack development with React, Node.js, and PostgreSQL. CI/CD experience a plus.",
    salary_min: 130000,
    salary_max: 165000,
    url: "https://careers.northwindlabs.com/jobs/senior-fullstack",
    employment_type: "c2c",
    sponsorship: "no",
  },
  {
    title: "Machine Learning Engineer",
    company: "Vector Dynamics",
    location: "Seattle, WA",
    description:
      "Build LLM-powered products. Experience with Python, RAG, and vector databases.",
    salary_min: 150000,
    salary_max: 190000,
    url: "https://www.linkedin.com/jobs/view/202",
    employment_type: "w2",
    sponsorship: "yes",
  },
  {
    title: "DevOps Engineer",
    company: "Cloud Harbor",
    location: "Chicago, IL",
    description:
      "Kubernetes, Terraform, and CI/CD pipelines for a growing SaaS platform.",
    salary_min: 120000,
    salary_max: 150000,
    url: "https://cloudharbor.workable.com/jobs/7",
    employment_type: "full_time",
    sponsorship: "no",
  },
  {
    title: "Software Engineering Intern",
    company: "Acme Software",
    location: "Austin, TX",
    description:
      "Summer internship building full-stack features. Great mentorship, real production work.",
    salary_min: 60000,
    salary_max: 70000,
    url: "https://www.linkedin.com/jobs/view/303",
    employment_type: "internship",
    sponsorship: "yes",
  },
];

export function mockJobs(hours: number, now = new Date()): JobPosting[] {
  return MOCK_LISTINGS.map((j, i) => {
    const step = Math.max(hours, 1) / (MOCK_LISTINGS.length + 1);
    const postedAt = new Date(now.getTime() - (i + 1) * step * HOUR_MS);
    return {
      source: "mock",
      external_id: `mock-${i}`,
      title: j.title,
      company: j.company,
      location: j.location,
      description: j.description,
      url: j.url,
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      posted_at: postedAt.toISOString(),
      employment_type: j.employment_type,
      sponsorship: j.sponsorship,
    };
  });
}

export function mockSource(): JobSource {
  return {
    name: "mock",
    async fetchRecentJobs(hours) {
      return mockJobs(hours);
    },
  };
}

export function getJobSource(source?: string): JobSource {
  const name = (source ?? process.env.JOB_SOURCE ?? "mock").toLowerCase();
  switch (name) {
    case "adzuna":
      return adzunaSource();
    case "usajobs":
      return usajobsSource();
    default:
      return mockSource();
  }
}
