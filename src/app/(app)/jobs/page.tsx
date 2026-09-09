import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { classifyApplySource } from "@/lib/jobs/applySource";
import { searchJobs } from "@/lib/jobs/search";
import { ingestJobs } from "@/lib/services/jobIngest";
import { JobFeed } from "@/components/JobFeed";

export const metadata = { title: "Jobs | Noventra" };

async function ensureJobsAreLoaded(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true });

  if (error) return;
  if ((count ?? 0) > 0) return;

  const { jobs } = await searchJobs({
    query: "",
    hours: null,
    location: "United States",
  });

  if (jobs.length === 0) return;

  await ingestJobs(supabase as never, jobs, { verify: false });
}

export default async function JobsPage() {
  const user = await requireOnboarded();
  const supabase = await createClient();

  await ensureJobsAreLoaded(supabase);

  const [{ data: jobs }, { data: savedApps }, { data: profile }, { data: matches }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, company, location, salary_min, salary_max, posted_at, url, description, employment_type, sponsorship, apply_url, verified_status, verified_source_url")
        .order("posted_at", { ascending: false })
        .limit(100),
      supabase
        .from("applications")
        .select("job_id")
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("resume_text")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("job_matches")
        .select("job_id, score")
        .eq("user_id", user.id)
        .limit(50),
    ]);

  const savedIds = (savedApps ?? []).map((a) => a.job_id).filter(Boolean);
  const scores: Record<string, number> = {};
  for (const m of matches ?? []) scores[m.job_id] = m.score;
  const hasResume = Boolean(profile?.resume_text?.trim());

  const feedJobs = (jobs ?? []).map((job) => ({
    ...job,
    url: job.url ?? "",
    applyKind: classifyApplySource(job.url ?? ""),
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
          Live feed
        </p>
      </div>
      <h1 className="mt-2 bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        Job feed
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Agents pull live postings from LinkedIn and company career sites across
        the US, filtered by your time window. Every job shows its match % against
        your resume. Run the agents on any role to tailor documents and prep.
      </p>

      <div className="mt-6">
        <JobFeed jobs={feedJobs} savedIds={savedIds} scores={scores} hasResume={hasResume} />
      </div>
    </main>
  );
}
