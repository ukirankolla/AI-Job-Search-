import { getChatProvider, parseJsonObject } from "@/lib/llm/provider";
import type {
  AgentInput,
  MatchResult,
  TailorResult,
  PrepResult,
  TrackerTask,
  VerificationResult,
  VerifierInput,
} from "@/lib/types";

function jobBrief(job: AgentInput["job"]): string {
  return [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location ?? "remote"}`,
    job.salary_min ? `Salary: ${job.salary_min}-${job.salary_max ?? "?"}` : "",
    `\nDescription:\n${job.description.slice(0, 4000)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function profileBrief(input: AgentInput): string {
  const p = input.profile;
  return [
    `Name: ${p.full_name}`,
    `Headline: ${p.title}`,
    `Summary: ${p.summary}`,
    `Skills: ${p.skills.join(", ")}`,
    `\n--- Relevant resume excerpts (RAG) ---\n${input.chunks
      .map((c) => `[${c.source_label || c.content_type}]\n${c.content}`)
      .join("\n\n")}`,
  ].join("\n");
}

export async function runMatcher(input: AgentInput): Promise<MatchResult> {
  const system = [
    "You are the MATCHER agent in a job-search multi-agent system.",
    "You score how well a candidate profile fits a job posting from 0-100.",
    "Respond with STRICT JSON matching this schema:",
    '{"score": number, "summary": string, "matched_skills": string[], "missing_skills": string[], "strengths": string[], "concerns": string[]}',
  ].join("\n");

  const user = `JOB:\n${jobBrief(input.job)}\n\nPROFILE:\n${profileBrief(input)}`;

  const provider = getChatProvider();
  const { content } = await provider.complete(system, user);
  const parsed = parseJsonObject<Partial<MatchResult>>(content);

  return {
    score: clampScore(parsed?.score),
    summary: parsed?.summary ?? "No summary provided.",
    matched_skills: parsed?.matched_skills ?? [],
    missing_skills: parsed?.missing_skills ?? [],
    strengths: parsed?.strengths ?? [],
    concerns: parsed?.concerns ?? [],
  };
}

export async function runRematch(
  input: AgentInput,
  tailoredResume: string,
): Promise<MatchResult> {
  const system = [
    "You are the REMATCH agent in a job-search multi-agent system.",
    "You score a candidate's REWRITTEN resume against the job posting from 0-100 after it has been tailored for the role.",
    "Respond with STRICT JSON matching this schema:",
    '{"score": number, "summary": string, "matched_skills": string[], "missing_skills": string[], "strengths": string[], "concerns": string[]}',
  ].join("\n");

  const user = `JOB:\n${jobBrief(input.job)}\n\nTAILORED RESUME:\n${tailoredResume}`;

  const provider = getChatProvider();
  const { content } = await provider.complete(system, user);
  const parsed = parseJsonObject<Partial<MatchResult>>(content);

  return {
    score: clampScore(parsed?.score),
    summary: parsed?.summary ?? "No summary provided.",
    matched_skills: parsed?.matched_skills ?? [],
    missing_skills: parsed?.missing_skills ?? [],
    strengths: parsed?.strengths ?? [],
    concerns: parsed?.concerns ?? [],
  };
}

export async function runTailor(input: AgentInput): Promise<TailorResult> {
  const system = [
    "You are the TAILOR agent in a job-search multi-agent system.",
    "You rewrite a candidate's resume and write a cover letter tuned to a specific job posting.",
    "Do NOT invent facts not present in the profile.",
    "Respond with STRICT JSON matching this schema:",
    '{"resume": string, "cover_letter": string, "highlights": string[]}',
  ].join("\n");

  const user = `JOB:\n${jobBrief(input.job)}\n\nPROFILE:\n${profileBrief(input)}`;

  const provider = getChatProvider();
  const { content } = await provider.complete(system, user);
  const parsed = parseJsonObject<Partial<TailorResult>>(content);

  return {
    resume: parsed?.resume ?? "No resume generated.",
    cover_letter: parsed?.cover_letter ?? "No cover letter generated.",
    highlights: parsed?.highlights ?? [],
  };
}

export async function runPrep(input: AgentInput): Promise<PrepResult> {
  const system = [
    "You are the PREP agent in a job-search multi-agent system.",
    "You generate interview questions, suggested answers, and preparation tips tailored to a job and candidate.",
    "Respond with STRICT JSON matching this schema:",
    '{"summary": string, "questions": [{"question": string, "answer": string, "tip": string}], "tips": string[]}',
  ].join("\n");

  const user = `JOB:\n${jobBrief(input.job)}\n\nPROFILE:\n${profileBrief(input)}`;

  const provider = getChatProvider();
  const { content } = await provider.complete(system, user);
  const parsed = parseJsonObject<Partial<PrepResult>>(content);

  return {
    summary: parsed?.summary ?? "",
    questions: parsed?.questions ?? [],
    tips: parsed?.tips ?? [],
  };
}

export function verifierBrief(input: VerifierInput): string {
  return [
    "JOB:",
    `TITLE: ${input.title}`,
    `COMPANY: ${input.company}`,
    `LOCATION: ${input.location || "remote"}`,
    `SOURCE: ${input.source}`,
    `POSTING URL: ${input.posting_url}`,
    "",
    "EVIDENCE:",
    `CANDIDATE APPLY URL: ${input.candidate_apply_url || "(none)"}`,
    `CANDIDATE SOURCE URL: ${input.candidate_source_url || "(none)"}`,
    "COMPANY PAGE EXCERPT:",
    input.company_page_excerpt.slice(0, 4000) || "(no excerpt)",
  ].join("\n");
}

function defaultVerifierReason(status: VerificationResult["status"]): string {
  if (status === "verified") return "Posting confirmed on the company's own career site.";
  if (status === "likely") return "Company career site resolved; exact posting not confirmed.";
  return "No company-owned posting found.";
}

function normalizeVerification(
  parsed: Partial<VerificationResult> | null,
  input: VerifierInput,
): VerificationResult {
  const status: VerificationResult["status"] =
    parsed?.status === "verified" || parsed?.status === "likely"
      ? parsed.status
      : "unverified";

  const confidence =
    typeof parsed?.confidence === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
      : status === "verified"
        ? 95
        : status === "likely"
          ? 70
          : 0;

  const reason =
    typeof parsed?.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : defaultVerifierReason(status);

  if (status === "unverified") {
    return { status, confidence, apply_url: "", source_url: "", reason };
  }

  let applyUrl =
    typeof parsed?.apply_url === "string" ? parsed.apply_url.trim() : "";
  let sourceUrl =
    typeof parsed?.source_url === "string" ? parsed.source_url.trim() : "";

  if (applyUrl && /linkedin\.com/i.test(applyUrl)) applyUrl = "";
  if (sourceUrl && /linkedin\.com/i.test(sourceUrl)) sourceUrl = "";
  if (!applyUrl) {
    applyUrl =
      input.candidate_apply_url?.trim() || input.candidate_source_url?.trim() || "";
  }
  if (!sourceUrl) sourceUrl = input.candidate_source_url;

  return { status, confidence, apply_url: applyUrl, source_url: sourceUrl, reason };
}

export async function runVerifier(input: VerifierInput): Promise<VerificationResult> {
  const system = [
    "You are the VERIFIER agent in a job-search multi-agent system.",
    "You decide whether a job posting is genuinely published on the company's own career site, and find the direct apply URL on that site - never a LinkedIn page, never an aggregator like Indeed or Adzuna.",
    'Respond with STRICT JSON matching this schema:',
    '{"status": "verified"|"likely"|"unverified", "confidence": number, "apply_url": string, "source_url": string, "reason": string}',
    'Use "verified" only when the company apply page was actually found (title or company confirmed on the company site).',
    'Use "likely" when the company\'s own career site was resolved but the exact posting is not confirmed.',
    'Use "unverified" when no company-owned apply source could be found; apply_url and source_url must be empty then.',
  ].join("\n");

  const provider = getChatProvider();
  const { content } = await provider.complete(system, verifierBrief(input));
  const parsed = parseJsonObject<Partial<VerificationResult>>(content);
  return normalizeVerification(parsed, input);
}

export async function runTracker(
  context: string,
): Promise<TrackerTask[]> {
  const system = [
    "You are the TRACKER agent in a job-search multi-agent system.",
    "You turn application-pipeline events into actionable tasks for the user.",
    "Respond with STRICT JSON matching this schema:",
    '[{"title": string, "priority": "high"|"medium"|"low", "reason": string}]',
  ].join("\n");

  const provider = getChatProvider();
  const { content } = await provider.complete(system, context);
  const parsed = parseJsonObject<TrackerTask[]>(content);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((t) => t && typeof t.title === "string")
    .slice(0, 10);
}

export interface ResumeProfile {
  full_name: string;
  title: string;
  summary: string;
  skills: string[];
}

export async function parseResume(text: string): Promise<ResumeProfile> {
  const system = [
    "You are the RESUME PARSER agent in a job-search multi-agent system.",
    "You extract a candidate's core profile from raw resume text.",
    "Do NOT invent facts not present in the resume.",
    "Respond with STRICT JSON matching this schema:",
    '{"full_name": string, "title": string, "summary": string, "skills": string[]}',
  ].join("\n");

  const provider = getChatProvider();
  const { content } = await provider.complete(
    system,
    `RESUME:\n${text.slice(0, 8000)}`,
  );
  const parsed = parseJsonObject<Partial<ResumeProfile>>(content);

  return {
    full_name: typeof parsed?.full_name === "string" ? parsed.full_name : "",
    title: typeof parsed?.title === "string" ? parsed.title : "",
    summary: typeof parsed?.summary === "string" ? parsed.summary : "",
    skills: Array.isArray(parsed?.skills) ? parsed.skills : [],
  };
}

function clampScore(score: unknown): number {
  const n = typeof score === "number" ? Math.round(score) : NaN;
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
