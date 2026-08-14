import { createAdminClient } from "@/lib/supabase/admin";
import { loadAgentInput } from "@/lib/services/agentService";
import { runMatcher, runTailor } from "@/lib/agents/workers";
import { sendApplicationEmail, parseMailtoUrl } from "@/lib/email";
import { WEEKLY_FREE_LIMIT, WEEK_LIMIT_MS } from "@/lib/subscription";

export interface AutoApplySettings {
  enabled: boolean;
  min_score: number;
  max_per_day: number;
  hours_lookback: number;
  include_locations: string[];
  exclude_companies: string[];
  email_submit: boolean;
}

export const DEFAULT_AUTO_APPLY_SETTINGS: AutoApplySettings = {
  enabled: true,
  min_score: 75,
  max_per_day: 5,
  hours_lookback: 24,
  include_locations: [],
  exclude_companies: [],
  email_submit: false,
};

export interface AutoApplySummary {
  state: "disabled" | "no_resume" | "quota" | "daily_limit" | "ran";
  considered: number;
  matched: number;
  submitted: number;
  ready: number;
  skipped: number;
  failed: number;
  error?: string;
}

const NO_RUN: AutoApplySummary = {
  state: "disabled",
  considered: 0,
  matched: 0,
  submitted: 0,
  ready: 0,
  skipped: 0,
  failed: 0,
};

export async function getAutoApplySettings(
  userId: string,
): Promise<AutoApplySettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("auto_apply_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { ...DEFAULT_AUTO_APPLY_SETTINGS };

  return {
    enabled: Boolean(data.enabled),
    min_score: clampInt(data.min_score, 0, 100, DEFAULT_AUTO_APPLY_SETTINGS.min_score),
    max_per_day: clampInt(data.max_per_day, 1, 100, DEFAULT_AUTO_APPLY_SETTINGS.max_per_day),
    hours_lookback: clampInt(data.hours_lookback, 1, 168, DEFAULT_AUTO_APPLY_SETTINGS.hours_lookback),
    include_locations: Array.isArray(data.include_locations)
      ? data.include_locations
      : [],
    exclude_companies: Array.isArray(data.exclude_companies)
      ? data.exclude_companies
      : [],
    email_submit: Boolean(data.email_submit),
  };
}

async function recordUsageAdmin(userId: string) {
  const admin = createAdminClient();
  await admin.from("usage_events").insert({ user_id: userId, kind: "resume_rewrite" });
}

async function freeTierQuotaAllowed(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.subscription_tier === "premium") return true;

  const since = new Date(Date.now() - WEEK_LIMIT_MS).toISOString();
  const { count } = await admin
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "resume_rewrite")
    .gte("created_at", since);
  return (count ?? 0) < WEEKLY_FREE_LIMIT;
}

interface CandidateJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  apply_url: string | null;
}

/**
 * The auto-pilot: for one user, looks at jobs posted within the lookback
 * window, runs the Matcher against the resume, tailors documents for every
 * job above the score threshold, records the application, and submits it
 * (email postings) or queues it as "ready" (portal postings).
 */
export async function runAutoApplyForUser(
  userId: string,
  maxCandidates = 50,
): Promise<AutoApplySummary> {
  const settings = await getAutoApplySettings(userId);
  if (!settings.enabled) return NO_RUN;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, resume_text, resume_embedding_status, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !profile.resume_text) {
    return { ...NO_RUN, state: "no_resume" };
  }

  if (!(await freeTierQuotaAllowed(userId))) {
    return { ...NO_RUN, state: "quota" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todaysApps } = await admin
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("origin", "auto")
    .gte("created_at", today.toISOString());
  let createdToday = todaysApps?.length ?? 0;

  if (createdToday >= settings.max_per_day) {
    return { ...NO_RUN, state: "daily_limit" };
  }

  const cutoff = new Date(
    Date.now() - settings.hours_lookback * 60 * 60 * 1000,
  ).toISOString();

  const { data: candidates, error: candidatesError } = await admin
    .from("jobs")
    .select("id, title, company, location, apply_url")
    .or(`posted_at.gte.${cutoff},fetched_at.gte.${cutoff}`)
    .not("apply_url", "is", null)
    .neq("apply_url", "")
    .limit(maxCandidates);
  if (candidatesError) {
    return { ...NO_RUN, state: "disabled", error: candidatesError.message };
  }

  const { data: existingRows } = await admin
    .from("applications")
    .select("job_id")
    .eq("user_id", userId);
  const appliedJobIds = new Set((existingRows ?? []).map((r) => r.job_id));

  const includeLocations = settings.include_locations
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
  const excludeCompanies = new Set(
    settings.exclude_companies.map((c) => c.trim().toLowerCase()).filter(Boolean),
  );

  const summary: AutoApplySummary = {
    state: "ran",
    considered: 0,
    matched: 0,
    submitted: 0,
    ready: 0,
    skipped: 0,
    failed: 0,
  };

  for (const job of (candidates ?? []) as CandidateJob[]) {
    if (createdToday >= settings.max_per_day) break;

    const company = (job.company ?? "").trim();
    const location = (job.location ?? "").trim();

    if (!job.apply_url) {
      summary.skipped++;
      continue;
    }
    if (appliedJobIds.has(job.id)) {
      summary.skipped++;
      continue;
    }
    if (excludeCompanies.has(company.toLowerCase())) {
      summary.skipped++;
      continue;
    }
    if (
      includeLocations.length > 0 &&
      !includeLocations.some((l) => location.toLowerCase().includes(l))
    ) {
      summary.skipped++;
      continue;
    }

    summary.considered++;

    try {
      const input = await loadAgentInput(userId, job.id);
      const match = await runMatcher(input);
      if (match.score < settings.min_score) {
        summary.skipped++;
        continue;
      }

      const tailor = await runTailor(input);

      const { data: app, error: insertError } = await admin
        .from("applications")
        .insert({
          user_id: userId,
          job_id: job.id,
          status: "saved",
          match_score: match.score,
          match_reason: match.summary,
          origin: "auto",
          auto_status: "queued",
        })
        .select("id")
        .single();
      if (insertError || !app) {
        summary.failed++;
        continue;
      }

      await admin.from("tailored_documents").insert([
        { application_id: app.id, doc_type: "resume", content: tailor.resume },
        {
          application_id: app.id,
          doc_type: "cover_letter",
          content: tailor.cover_letter,
        },
      ]);
      await recordUsageAdmin(userId);
      summary.matched++;
      createdToday++;

      const submitted = await submitApplication(
        app.id,
        job,
        settings.email_submit,
        {
          name: profile.full_name || "Applicant",
          email: profile.email || "",
          resume: tailor.resume,
          cover_letter: tailor.cover_letter,
        },
      );
      if (submitted) summary.submitted++;
      else summary.ready++;
    } catch {
      summary.failed++;
    }
  }

  await admin.from("auto_apply_log").insert({
    user_id: userId,
    considered: summary.considered,
    matched: summary.matched,
    submitted: summary.submitted,
    ready: summary.ready,
    skipped: summary.skipped,
    failed: summary.failed,
  });

  return summary;
}

async function submitApplication(
  applicationId: string,
  job: CandidateJob,
  emailSubmit: boolean,
  applicant: {
    name: string;
    email: string;
    resume: string;
    cover_letter: string;
  },
): Promise<boolean> {
  const admin = createAdminClient();
  const mailto = parseMailtoUrl(job.apply_url);

  if (emailSubmit && mailto) {
    const sent = await sendApplicationEmail({
      to: mailto.to,
      subject:
        mailto.subject ||
        `Application for ${job.title}${job.company ? ` at ${job.company}` : ""}`,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      coverLetter: applicant.cover_letter,
      resume: applicant.resume,
      resumeFilename: `${sanitizeFilename(job.company || "application")}-resume.txt`,
    });
    if (sent) {
      await admin
        .from("applications")
        .update({
          status: "applied",
          auto_status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", applicationId);
      return true;
    }
    await admin
      .from("applications")
      .update({ auto_status: "failed", auto_error: "Email submission failed" })
      .eq("id", applicationId);
    return false;
  }

  await admin
    .from("applications")
    .update({ auto_status: "ready" })
    .eq("id", applicationId);
  return false;
}

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "application";
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === "number" ? Math.round(value) : NaN;
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
