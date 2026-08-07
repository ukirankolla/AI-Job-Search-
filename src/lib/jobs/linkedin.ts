import type { JobPosting } from "@/lib/types";

const HOUR_MS = 60 * 60 * 1000;

/**
 * LinkedIn has no public job-search API. This module talks to the guest
 * (logged-out) search endpoint that powers linkedin.com/jobs/search. It is
 * undocumented and unofficial: it can be rate-limited or blocked, and its HTML
 * markup changes over time. Treat it as best-effort with graceful failures.
 */

const HOURS_TO_TPR: Record<number, string> = {
  1: "r3600",
  4: "r14400",
  8: "r28800",
  12: "r43200",
  24: "r86400",
};

const TYPE_TO_JT: Record<string, string> = {
  full_time: "F",
  c2c: "C",
  internship: "I",
};

export interface LinkedInSearchParams {
  query?: string;
  hours?: number | null;
  employmentTypes?: string[];
  location?: string;
}

export function hoursToTPR(hours?: number | null): string | undefined {
  return hours ? HOURS_TO_TPR[hours] : undefined;
}

export function typesToJT(types?: string[]): string | undefined {
  const codes = (types ?? []).map((t) => TYPE_TO_JT[t]).filter(Boolean);
  return codes.length > 0 ? codes.join(",") : undefined;
}

export function buildLinkedInSearchUrl(params: LinkedInSearchParams): string {
  const sp = new URLSearchParams({ start: "0", position: "1", pageNum: "0" });
  const query = params.query?.trim();
  if (query) sp.set("keywords", query);
  const location = params.location?.trim();
  if (location) sp.set("location", location);
  const tpr = hoursToTPR(params.hours);
  if (tpr) sp.set("f_TPR", tpr);
  const jt = typesToJT(params.employmentTypes);
  if (jt) sp.set("f_JT", jt);
  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${sp.toString()}`;
}

function cleanText(input: string): string {
  return input
    .replace(/<span[^>]*class="sr-only"[^>]*>[\s\S]*?<\/span>/gi, "")
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

function extractText(block: string, re: RegExp): string {
  const match = block.match(re);
  return match ? cleanText(match[1]) : "";
}

/**
 * Maps LinkedIn's human-readable listing time ("Just now", "3 hours ago",
 * "2 days ago") into an ISO timestamp. Unknown text falls back to "now" so the
 * posting survives the app's local time-window filter.
 */
export function parseRelativeTime(text: string, now = new Date()): string {
  const t = text.toLowerCase();
  if (!t || t.includes("just now") || t.includes("today")) {
    return now.toISOString();
  }
  const match = t.match(/(\d+)\s*(minute|hour|day|week|month)s?\s*ago/);
  if (!match) return now.toISOString();
  const n = Number(match[1]);
  const factor =
    match[2] === "minute"
      ? 60_000
      : match[2] === "hour"
        ? HOUR_MS
        : match[2] === "day"
          ? 24 * HOUR_MS
          : match[2] === "week"
            ? 7 * 24 * HOUR_MS
            : 30 * 24 * HOUR_MS;
  return new Date(now.getTime() - n * factor).toISOString();
}

/**
 * Extracts job cards from the guest search HTML response. LinkedIn's markup has
 * changed over time: cards used to be `<li class="base-card">` and now are a
 * `<div class="base-card ...">` nested inside a bare `<li>`, with title/company
 * under `base-search-card__title`/`base-search-card__subtitle`. Handle both.
 */
export function parseLinkedInJobs(html: string, now = new Date()): JobPosting[] {
  const out: JobPosting[] = [];
  const seen = new Set<string>();

  for (const raw of html.split(/<div class="base-card |<li class="base-card /).slice(1)) {
    const block = `<div class="base-card ${raw}`;
    const url = extractText(block, /href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]+)"/);
    if (!url) continue;
    const cleanUrl = url.replace(/&amp;/g, "&");
    const idMatch = cleanUrl.split("?")[0].match(/(\d+)$/);
    const externalId = idMatch ? idMatch[1] : cleanUrl;
    if (seen.has(externalId)) continue;

    const title = extractText(
      block,
      /class="base(?:-search)?-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i,
    );
    if (!title) continue;
    seen.add(externalId);

    out.push({
      source: "linkedin",
      external_id: externalId,
      title,
      company: extractText(
        block,
        /class="base(?:-search)?-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i,
      ),
      location: extractText(
        block,
        /job-search-card__location[^>]*>([\s\S]*?)<\/(?:span|p)>/i,
      ),
      description: extractText(block, /job-search-card__snippet[^>]*>([\s\S]*?)<\/p>/i),
      url: cleanUrl,
      salary_min: null,
      salary_max: null,
      posted_at: parseRelativeTime(
        extractText(block, /job-search-card__listdate[^>]*>([\s\S]*?)<\/time>/i),
        now,
      ),
      employment_type: null,
      sponsorship: null,
    });
  }

  return out;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Converts a job description's rich HTML to plain text, preserving paragraph
 * and list breaks as line breaks.
 */
export function descriptionToText(html: string): string {
  return html
    .replace(/<span[^>]*class="sr-only"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|section|tr|table)>/gi, "\n\n")
    .replace(/<\/(li|ul|ol|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts the full description from a LinkedIn job detail page. The markup is
 * a rich-HTML div under `show-more-less-html__markup`; fall back to the plain
 * `description__text` node if the class name changes.
 */
export function extractLinkedInDescription(html: string): string {
  const rich = html.match(
    /class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (rich) {
    const text = descriptionToText(rich[1]);
    if (text) return text;
  }
  const plain = html.match(
    /class="description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  return plain ? descriptionToText(plain[1]) : "";
}

export async function fetchLinkedInDescription(
  url: string,
  opts?: { signal?: AbortSignal },
): Promise<string> {
  const res = await fetch(url, {
    headers: {
      accept: "text/html",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": BROWSER_UA,
    },
    signal: opts?.signal,
    next: { revalidate: 0 },
  });
  if (!res.ok) return "";
  return extractLinkedInDescription(await res.text());
}

export async function searchLinkedInJobs(
  params: LinkedInSearchParams,
  opts?: { signal?: AbortSignal },
): Promise<JobPosting[]> {
  const res = await fetch(buildLinkedInSearchUrl(params), {
    headers: {
      accept: "text/html",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": BROWSER_UA,
    },
    signal: opts?.signal,
    next: { revalidate: 0 },
  });

  if (res.status === 429) {
    throw new Error("LinkedIn is rate-limiting requests. Wait a minute and try again.");
  }
  if (res.status === 403) {
    throw new Error("LinkedIn blocked this request. Try again shortly.");
  }
  if (!res.ok) {
    throw new Error(`LinkedIn request failed with status ${res.status}.`);
  }

  return parseLinkedInJobs(await res.text());
}
