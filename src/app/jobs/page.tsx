import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/JobForm";
import { JobFeedImporter } from "@/components/JobFeedImporter";
import { SampleJobsButton } from "@/components/SampleJobsButton";
import { JobFeed } from "@/components/JobFeed";

export const metadata = { title: "Jobs | AI Job Search" };

export default async function JobsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, location, salary_min, salary_max, posted_at, url, description")
    .order("posted_at", { ascending: false })
    .limit(50);

  const { data: savedApps } = await supabase
    .from("applications")
    .select("job_id")
    .eq("user_id", user.id);

  const savedIds = (savedApps ?? []).map((a) => a.job_id).filter(Boolean);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Job feed</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fresh postings are discovered automatically. Toggle “Last 8 hours” to
        see only the newest roles, or add jobs manually. Run the agents on any
        role to score fit, tailor documents, and prep.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <JobFeed jobs={jobs ?? []} savedIds={savedIds} />
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
