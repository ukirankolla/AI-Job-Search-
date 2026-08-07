import type { JobPosting } from "@/lib/types";
import { isPostedWithinHours } from "@/lib/jobs/sources";
import { dedupeJobs } from "@/lib/jobs/search";

/**
 * Crawls companies' own career pages and extracts schema.org JobPosting
 * structured data (the same markup Google Jobs indexes). This is free and
 * legitimate, but only covers pages that publish the markup — it cannot reach
 * LinkedIn, Indeed, Dice, or ZipRecruiter.
 */

const SCRIPT_RE =
  /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

interface RawLocation {
  address?:
    | string
    | {
        addressLocality?: string;
        addressRegion?: string;
        addressCountry?: string;
      };
  name?: string;
}

interface RawSalary {
  value?:
    | number
    | { value?: unknown; minValue?: unknown; maxValue?: unknown };
  minValue?: unknown;
  maxValue?: unknown;
}

interface RawJobPosting {
  "@type"?: string | string[];
  title?: string;
  datePosted?: string;
  url?: string;
  description?: string;
  hiringOrganization?: { name?: string };
  jobLocation?: RawLocation | RawLocation[] | string;
  baseSalary?: RawSalary;
  employmentType?: string | string[];
  identifier?: { value?: string } | string;
}

const NON_US_PATTERNS: RegExp[] = [
  /\bcanada\b/,
  /\bunited kingdom\b/,
  /\buk\b/,
  /\bengland\b/,
  /\bscotland\b/,
  /\bireland\b/,
  /\bgermany\b/,
  /\bfrance\b/,
  /\bspain\b/,
  /\bitaly\b/,
  /\bnetherlands\b/,
  /\bbelgium\b/,
  /\bswitzerland\b/,
  /\baustria\b/,
  /\bpoland\b/,
  /\bportugal\b/,
  /\bgreece\b/,
  /\bsweden\b/,
  /\bnorway\b/,
  /\bdenmark\b/,
  /\bfinland\b/,
  /\bindia\b/,
  /\bchina\b/,
  /\bjapan\b/,
  /\bkorea\b/,
  /\bsingapore\b/,
  /\bmalaysia\b/,
  /\bindonesia\b/,
  /\bthailand\b/,
  /\bvietnam\b/,
  /\bphilippines\b/,
  /\baustralia\b/,
  /\bnew zealand\b/,
  /\bbrazil\b/,
  /\bmexico\b/,
  /\bargentina\b/,
  /\bchile\b/,
  /\bisrael\b/,
  /\bdubai\b/,
  /\buae\b/,
  /\bsouth africa\b/,
  /\bnigeria\b/,
  /\begypt\b/,
  /\bturkey\b/,
];

/**
 * Returns true for US, US-state, "Remote", or unknown locations; false only for
 * clearly non-US country mentions (best-effort heuristic).
 */
export function isUsLocation(location: string | null | undefined): boolean {
  const l = (location ?? "").toLowerCase();
  if (!l) return true;
  return !NON_US_PATTERNS.some((re) => re.test(l));
}

export function composeLocation(
  loc: RawLocation | RawLocation[] | string | undefined | null,
): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc.trim();
  if (Array.isArray(loc)) {
    return loc.map((x) => composeLocation(x)).filter(Boolean).join("; ");
  }
  const addr = loc.address;
  if (typeof addr === "string") return addr.trim();
  if (addr && typeof addr === "object") {
    const parts = [
      addr.addressLocality,
      addr.addressRegion,
      addr.addressCountry && addr.addressCountry !== "US"
        ? addr.addressCountry
        : undefined,
    ].filter(Boolean);
    return parts.join(", ");
  }
  return loc.name?.trim() ?? "";
}

export function parseSchemaSalary(baseSalary: RawSalary | undefined): {
  min: number | null;
  max: number | null;
} {
  if (!baseSalary) return { min: null, max: null };
  const value = (baseSalary.value ?? baseSalary) as unknown;
  if (typeof value === "number") return { min: value, max: value };
  if (value && typeof value === "object") {
    const v = value as { value?: unknown; minValue?: unknown; maxValue?: unknown };
    const num = (x: unknown): number | null => {
      const n = Number(x);
      return Number.isFinite(n) ? n : null;
    };
    return {
      min: num(v.minValue ?? v.value),
      max: num(v.maxValue ?? v.value),
    };
  }
  return { min: null, max: null };
}

export function schemaEmploymentType(
  type: string | string[] | undefined,
): string | null {
  const joined = (Array.isArray(type) ? type : [type])
    .map(String)
    .join(" ")
    .toLowerCase();
  if (joined.includes("intern")) return "internship";
  if (
    joined.includes("contract") ||
    joined.includes("contractor") ||
    joined.includes("temporary") ||
    joined.includes("temp")
  ) {
    return "c2c";
  }
  if (joined.includes("full")) return "full_time";
  return null;
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

function collectJobPostings(node: unknown, out: RawJobPosting[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectJobPostings(item, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  if (Array.isArray(obj["@graph"])) collectJobPostings(obj["@graph"], out);
  if (obj.itemListElement !== undefined) {
    collectJobPostings(obj.itemListElement, out);
  }

  const item =
    obj.item && typeof obj.item === "object" ? (obj.item as Record<string, unknown>) : obj;
  const t = item["@type"];
  const types = Array.isArray(t) ? t : t ? [t] : [];
  if (types.some((x) => String(x).toLowerCase() === "jobposting")) {
    out.push(item as RawJobPosting);
  }
}

function identifierValue(id: RawJobPosting["identifier"]): string | undefined {
  if (!id) return undefined;
  return typeof id === "string" ? id : id.value;
}

/**
 * Parses a career page's HTML for JobPosting JSON-LD and maps it to postings,
 * filtered to a time window and US locations.
 */
export function parseJobPostingLdJson(
  html: string,
  baseUrl: string,
  hours: number,
  now = new Date(),
): JobPosting[] {
  const out: JobPosting[] = [];
  const seen = new Set<string>();
  SCRIPT_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SCRIPT_RE.exec(html))) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const raw: RawJobPosting[] = [];
    collectJobPostings(parsed, raw);

    for (const node of raw) {
      const title = (node.title ?? "").trim();
      const rawUrl = node.url ?? identifierValue(node.identifier);
      if (!title || !rawUrl) continue;

      let url: string;
      try {
        url = new URL(rawUrl, baseUrl).href;
      } catch {
        continue;
      }
      if (seen.has(url)) continue;

      const datePosted = node.datePosted
        ? new Date(node.datePosted).toISOString()
        : null;
      if (!isPostedWithinHours(datePosted, hours, now)) continue;

      const location = composeLocation(node.jobLocation);
      if (!isUsLocation(location)) continue;

      seen.add(url);
      const salary = parseSchemaSalary(node.baseSalary);
      out.push({
        source: "career",
        external_id: url,
        title,
        company: node.hiringOrganization?.name ?? "",
        location,
        description: stripHtml(node.description ?? ""),
        url,
        salary_min: salary.min,
        salary_max: salary.max,
        posted_at: datePosted,
        employment_type: schemaEmploymentType(node.employmentType),
        sponsorship: null,
      });
    }
  }

  return out;
}

export async function crawlCareerPage(
  url: string,
  hours: number,
  now = new Date(),
): Promise<JobPosting[]> {
  const res = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": BROWSER_UA,
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseJobPostingLdJson(await res.text(), url, hours, now);
}

export interface CrawlOutcome {
  jobs: JobPosting[];
  errors: { page: string; message: string }[];
}

export async function crawlCareerPages(
  pages: string[],
  hours: number,
  now = new Date(),
): Promise<CrawlOutcome> {
  const results = await Promise.allSettled(
    pages.map((url) => crawlCareerPage(url, hours, now)),
  );
  const jobs: JobPosting[] = [];
  const errors: { page: string; message: string }[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      errors.push({ page: pages[i], message: (result.reason as Error).message });
    }
  });
  return { jobs: dedupeJobs(jobs), errors };
}
