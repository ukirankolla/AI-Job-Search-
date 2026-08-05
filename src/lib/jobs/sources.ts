import type { JobPosting } from "@/lib/types";

const HOUR_MS = 60 * 60 * 1000;

export type JobSourceName = "greenhouse" | "lever" | "mock";

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
// Greenhouse (public company job boards — apply links go to the company portal)
// ---------------------------------------------------------------------------

interface GreenhouseJob {
  id?: number;
  title?: string;
  location?: { name?: string };
  absolute_url?: string;
  content?: string;
  updated_at?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapGreenhouseJobs(
  raw: { jobs?: GreenhouseJob[] },
  hours: number,
  now = new Date(),
  company = "",
): JobPosting[] {
  const out: JobPosting[] = [];
  for (const job of raw.jobs ?? []) {
    if (!job.id || !job.title || !isPostedWithinHours(job.updated_at, hours, now)) {
      continue;
    }
    out.push({
      source: "greenhouse",
      external_id: String(job.id),
      title: job.title,
      company,
      location: job.location?.name ?? "",
      description: stripHtml(job.content ?? ""),
      url: job.absolute_url ?? "",
      salary_min: null,
      salary_max: null,
      posted_at: job.updated_at ?? null,
      employment_type: null,
      sponsorship: null,
    });
  }
  return out;
}

export function greenhouseSource(): JobSource {
  return {
    name: "greenhouse",
    async fetchRecentJobs(hours, opts) {
      const board = process.env.GREENHOUSE_BOARD;
      if (!board) return [];
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`,
        { signal: opts?.signal, next: { revalidate: 0 } },
      );
      if (!res.ok) {
        throw new Error(`Greenhouse request failed: ${res.status}`);
      }
      return mapGreenhouseJobs(await res.json(), hours, undefined, board);
    },
  };
}

// ---------------------------------------------------------------------------
// Lever (public company job boards — apply links go to the company portal)
// ---------------------------------------------------------------------------

interface LeverPosting {
  id?: string;
  text?: string;
  categories?: { commitment?: string; location?: string };
  hostedUrl?: string;
  descriptionPlain?: string;
  createdAt?: number;
  salaryRange?: { min?: number | null; max?: number | null };
}

function commitmentToEmploymentType(type: string | undefined): string | null {
  const v = (type ?? "").toLowerCase();
  if (v.includes("intern")) return "internship";
  if (v.includes("contract") || v.includes("temp")) return "c2c";
  if (v.includes("full")) return "full_time";
  return null;
}

export function mapLeverJobs(
  raw: unknown,
  hours: number,
  now = new Date(),
  company = "",
): JobPosting[] {
  if (!Array.isArray(raw)) return [];
  const out: JobPosting[] = [];
  for (const p of raw as LeverPosting[]) {
    if (!p.id || !p.text) continue;
    const postedIso = p.createdAt
      ? new Date(p.createdAt).toISOString()
      : null;
    if (!isPostedWithinHours(postedIso, hours, now)) continue;
    out.push({
      source: "lever",
      external_id: p.id,
      title: p.text,
      company,
      location: p.categories?.location ?? "",
      description: p.descriptionPlain ?? "",
      url: p.hostedUrl ?? "",
      salary_min: p.salaryRange?.min ?? null,
      salary_max: p.salaryRange?.max ?? null,
      posted_at: postedIso,
      employment_type: commitmentToEmploymentType(p.categories?.commitment),
      sponsorship: null,
    });
  }
  return out;
}

export function leverSource(): JobSource {
  return {
    name: "lever",
    async fetchRecentJobs(hours, opts) {
      const company = process.env.LEVER_COMPANY;
      if (!company) return [];
      const res = await fetch(
        `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`,
        { signal: opts?.signal, next: { revalidate: 0 } },
      );
      if (!res.ok) {
        throw new Error(`Lever request failed: ${res.status}`);
      }
      return mapLeverJobs(await res.json(), hours, undefined, company);
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
    case "greenhouse":
      return greenhouseSource();
    case "lever":
      return leverSource();
    default:
      return mockSource();
  }
}
