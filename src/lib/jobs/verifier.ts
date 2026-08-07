import type { JobPosting, VerificationResult, VerifierInput } from "@/lib/types";
import { isMockProvider } from "@/lib/llm/provider";
import { runVerifier } from "@/lib/agents/workers";
import { classifyApplySource } from "@/lib/jobs/applySource";
import {
  companyCareersUrl,
  extractCompanySlug,
  extractCompanyWebsite,
  extractLinkedInApplyUrl,
  fetchLinkedInCompanyPage,
  fetchLinkedInJobPage,
} from "@/lib/jobs/linkedin";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 3000;

export interface VerifierCache {
  jobPages: Map<string, string>;
  companyPages: Map<string, Promise<string>>;
}

export function emptyVerifierCache(): VerifierCache {
  return { jobPages: new Map(), companyPages: new Map() };
}

export interface VerifyBatchOptions {
  concurrency?: number;
  maxLinkedIn?: number;
  cache?: VerifierCache;
}

export function verifiedFromUrl(
  url: string,
  reason: string,
): VerificationResult {
  let sourceUrl = url;
  try {
    sourceUrl = new URL(url).origin;
  } catch {
    // keep url as the source fallback
  }
  return {
    status: "verified",
    confidence: 95,
    apply_url: url,
    source_url: sourceUrl,
    reason,
  };
}

export function unverifiedResult(reason: string): VerificationResult {
  return {
    status: "unverified",
    confidence: 0,
    apply_url: "",
    source_url: "",
    reason,
  };
}

function abortable(ms: number): {
  signal: AbortSignal;
  cancel: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

async function fetchWithTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  fallback: T,
): Promise<T> {
  const { signal, cancel } = abortable(FETCH_TIMEOUT_MS);
  try {
    return await fn(signal);
  } catch {
    return fallback;
  } finally {
    cancel();
  }
}

async function fetchPageExcerpt(url: string): Promise<string> {
  return fetchWithTimeout(async (signal) => {
    const res = await fetch(url, {
      headers: {
        accept: "text/html",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": BROWSER_UA,
      },
      signal,
      next: { revalidate: 0 },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  }, "");
}

async function judge(
  input: VerifierInput,
): Promise<VerificationResult> {
  try {
    return await runVerifier(input);
  } catch {
    return unverifiedResult("The verifier agent could not produce a verdict.");
  }
}

/**
 * Verifies that a posting is genuinely published on the company's own career
 * site and resolves the direct apply URL there. Jobs whose URL already lives on
 * a company domain are verified immediately without any network calls; LinkedIn
 * postings are checked via the guest job page, the company page, and the
 * resolved career site, then judged by the VERIFIER agent. In mock mode (no
 * OpenAI key) the LinkedIn fetch chain is skipped and the agent judges from
 * evidence alone so the demo never depends on live network access.
 */
export async function verifyJob(
  job: JobPosting,
  cache?: VerifierCache,
): Promise<VerificationResult> {
  const url = job.url?.trim();
  if (!url) return unverifiedResult("No source URL to verify.");

  const kind = classifyApplySource(url);
  if (kind === "company") {
    return verifiedFromUrl(url, "The posting lives on the company's own domain.");
  }
  if (kind !== "linkedin") {
    return unverifiedResult(
      "Aggregator or unknown source; no company-owned posting found.",
    );
  }

  if (isMockProvider()) {
    return judge({
      title: job.title,
      company: job.company ?? "",
      location: job.location ?? "",
      source: job.source ?? "feed",
      posting_url: url,
      candidate_apply_url: "",
      candidate_source_url: "",
      company_page_excerpt: "",
    });
  }

  const store = cache ?? emptyVerifierCache();

  let html = store.jobPages.get(url) ?? "";
  if (!html) {
    html = await fetchWithTimeout(
      (signal) => fetchLinkedInJobPage(url, { signal }),
      "",
    );
    store.jobPages.set(url, html);
  }
  if (!html) {
    return unverifiedResult("Could not reach the LinkedIn posting.");
  }

  const directApply = extractLinkedInApplyUrl(html);
  if (directApply) {
    return verifiedFromUrl(
      directApply,
      "LinkedIn exposed the company's own apply link.",
    );
  }

  const slug = extractCompanySlug(html);
  let careers = "";
  if (slug) {
    let companyHtml = store.companyPages.get(slug);
    if (!companyHtml) {
      companyHtml = fetchWithTimeout(
        (signal) => fetchLinkedInCompanyPage(slug, { signal }),
        "",
      );
      store.companyPages.set(slug, companyHtml);
    }
    const html = await companyHtml;
    const website = extractCompanyWebsite(html);
    if (website) careers = companyCareersUrl(website);
  }

  const excerpt = careers ? await fetchPageExcerpt(careers) : "";

  return judge({
    title: job.title,
    company: job.company ?? "",
    location: job.location ?? "",
    source: job.source ?? "feed",
    posting_url: url,
    candidate_apply_url: careers,
    candidate_source_url: careers,
    company_page_excerpt: excerpt,
  });
}

/**
 * Verifies a batch of jobs with bounded concurrency. Company-domain jobs are
 * marked verified instantly; LinkedIn jobs are checked in parallel (network
 * fetches are deduped via a shared cache) up to `maxLinkedIn` per batch.
 */
export async function verifyJobBatch(
  jobs: JobPosting[],
  opts?: VerifyBatchOptions,
): Promise<Map<string, VerificationResult>> {
  const results = new Map<string, VerificationResult>();
  const cache = opts?.cache ?? emptyVerifierCache();

  const quick: JobPosting[] = [];
  const linkedin: JobPosting[] = [];
  const seen = new Set<string>();
  for (const job of jobs) {
    const url = job.url ?? "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const kind = classifyApplySource(url);
    if (kind === "company") quick.push(job);
    else if (kind === "linkedin") linkedin.push(job);
  }

  for (const job of quick) {
    results.set(
      job.url ?? "",
      verifiedFromUrl(job.url ?? "", "The posting lives on the company's own domain."),
    );
  }

  const cap = Math.min(linkedin.length, opts?.maxLinkedIn ?? 60);
  const targets = linkedin.slice(0, cap);

  const queue = [...targets];
  let next = 0;
  const workers = Math.max(1, opts?.concurrency ?? 5);
  await Promise.all(
    Array.from({ length: Math.min(workers, queue.length) }, async () => {
      while (next < queue.length) {
        const job = queue[next++];
        const result = await verifyJob(job, cache).catch((err) =>
          unverifiedResult(
            err instanceof Error ? err.message : "Verification failed.",
          ),
        );
        results.set(job.url ?? "", result);
      }
    }),
  );

  for (const job of linkedin) {
    const url = job.url ?? "";
    if (!results.has(url)) {
      results.set(
        url,
        unverifiedResult("Verification skipped (batch limit)."),
      );
    }
  }

  return results;
}
