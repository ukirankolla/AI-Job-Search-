import { getChatProvider, parseJsonObject } from "@/lib/llm/provider";
import type {
  AgentInput,
  MatchResult,
  TailorResult,
  PrepResult,
  TrackerTask,
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
