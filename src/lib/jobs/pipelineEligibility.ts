export type PipelineEligibilitySource =
  | "linkedin"
  | "manual"
  | "greenhouse"
  | "lever"
  | "workable"
  | "ashby"
  | "adzuna"
  | "mock"
  | string;

export function getJobSourceLabel(source?: string | null): string {
  if (!source) return "Search result";
  const normalized = source.toLowerCase();
  if (normalized === "linkedin") return "LinkedIn";
  if (normalized === "manual") return "Manual";
  if (normalized === "greenhouse") return "Greenhouse";
  if (normalized === "lever") return "Lever";
  if (normalized === "workable") return "Workable";
  if (normalized === "ashby") return "Ashby";
  if (normalized === "adzuna") return "Adzuna";
  if (normalized === "mock") return "Mock";
  return source;
}

export function isPipelineEligibleJob(job: {
  source?: string | null;
  url?: string | null;
  apply_url?: string | null;
}): boolean {
  const source = (job.source ?? "").toLowerCase();
  const directUrl = (job.apply_url ?? job.url ?? "").trim();
  const isDirect = Boolean(directUrl) && !/linkedin\.com/i.test(directUrl);

  if (source === "manual") return true;
  if (source === "linkedin") return isDirect;
  if (source === "greenhouse" || source === "lever" || source === "workable" || source === "ashby") {
    return isDirect;
  }
  if (source === "adzuna") return isDirect;
  if (source === "mock") return isDirect;

  return Boolean(directUrl);
}
