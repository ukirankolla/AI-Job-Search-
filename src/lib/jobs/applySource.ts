export type ApplySourceKind = "linkedin" | "company" | "board" | "unknown";

const BOARD_HOSTS = new Set([
  "adzuna.com",
  "indeed.com",
  "glassdoor.com",
  "monster.com",
  "ziprecruiter.com",
  "careerbuilder.com",
  "usajobs.gov",
]);

/**
 * Classifies the application URL of a job so the feed can show only jobs that
 * point at a company career site or LinkedIn, per product requirements.
 */
export function classifyApplySource(
  url: string | undefined | null,
): ApplySourceKind {
  if (!url) return "unknown";
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }

  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) return "linkedin";
  if (BOARD_HOSTS.has(host) || host.endsWith(".usajobs.gov")) return "board";
  return "company";
}

export function isDirectSource(url: string | undefined | null): boolean {
  const kind = classifyApplySource(url);
  return kind === "linkedin" || kind === "company";
}
