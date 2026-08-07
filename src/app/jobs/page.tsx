import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { classifyApplySource } from "@/lib/jobs/applySource";
import { JobForm } from "@/components/JobForm";
import { JobFeedImporter } from "@/components/JobFeedImporter";
import { SampleJobsButton } from "@/components/SampleJobsButton";
import { JobFeed } from "@/components/JobFeed";

export const metadata = { title: "Jobs | Noventra" };

export default async function JobsPage() {
  const user = await requireOnboarded();
  const supabase = await createClient();

  const [{ data: jobs }, { data: savedApps }, { data: profile }, { data: matches }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, company, location, salary_min, salary_max, posted_at, url, description, employment_type, sponsorship")
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
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
        Jobs
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        Job feed
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Search pulls live postings from LinkedIn and company career sites across
        the US, filtered by your time window. Every job shows its match % against
        your resume. Run the agents on any role to tailor documents and prep.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <JobFeed jobs={feedJobs} savedIds={savedIds} scores={scores} hasResume={hasResume} />
        </div>

        <div className="space-y-4">
          <JobForm />
          <SampleJobsButton />
          <JobFeedImporter />
        </div>
      </div>
    </main>
  );
}
