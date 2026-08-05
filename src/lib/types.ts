export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  title: string;
  summary: string;
  skills: string[];
  resume_text: string;
  resume_embedding_status: "none" | "pending" | "done" | "failed";
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
  onboarding_completed?: boolean;
  subscription_tier?: "free" | "premium";
  created_at: string;
  updated_at: string;
}

export interface ProfileChunk {
  id: string;
  profile_id: string;
  content_type: string;
  content: string;
  source_label: string;
  metadata: Record<string, unknown>;
}

export interface JobPosting {
  id?: string;
  source?: string;
  external_id?: string | null;
  title: string;
  company: string;
  location?: string;
  description: string;
  url?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  posted_at?: string | null;
  employment_type?: string | null;
  sponsorship?: string | null;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string | null;
  status: ApplicationStatus;
  match_score: number | null;
  match_reason: string;
  custom_title: string;
  custom_company: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  job?: JobPosting | null;
}

export interface TailoredDocument {
  id: string;
  application_id: string;
  doc_type: "resume" | "cover_letter";
  content: string;
  created_at: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  tip?: string;
}

export interface InterviewPrep {
  id: string;
  application_id: string;
  content: {
    summary: string;
    questions: InterviewQuestion[];
    tips: string[];
  };
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export type AgentName = "retrieve" | "matcher" | "tailor" | "prep" | "tracker";

export interface AgentStep {
  agent: AgentName;
  status: "running" | "completed" | "failed";
  output?: string;
  ts: string;
}

export interface AgentRun {
  id: string;
  user_id: string;
  run_type: "analyze" | "apply" | "prep";
  application_id: string | null;
  status: "running" | "completed" | "failed";
  steps: AgentStep[];
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  score: number;
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  concerns: string[];
}

export interface JobMatch {
  id: string;
  user_id: string;
  job_id: string;
  score: number;
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  concerns: string[];
  created_at: string;
  updated_at: string;
}

export interface TailorResult {
  resume: string;
  cover_letter: string;
  highlights: string[];
}

export interface PrepResult {
  summary: string;
  questions: InterviewQuestion[];
  tips: string[];
}

export interface TrackerTask {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface AgentInput {
  profile: Profile;
  chunks: ProfileChunk[];
  job: JobPosting;
}

export type AgentOutput =
  | { kind: "match"; data: MatchResult }
  | { kind: "tailor"; data: TailorResult }
  | { kind: "prep"; data: PrepResult }
  | { kind: "tracker"; data: TrackerTask[] };
