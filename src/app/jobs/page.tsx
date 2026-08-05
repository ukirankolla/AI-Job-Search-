import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/JobForm";
import { JobFeedImporter } from "@/components/JobFeedImporter";
import { AddToPipelineButton } from "@/components/AddToPipelineButton";

export const metadata = { title: "Jobs | AI Job Search" };

export default async function JobsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, location, salary_min, salary_max, posted_at, description")
    .order("fetched_at", { ascending: false })
    .limit(50);

  const { data: savedApps } = await supabase
    .from("applications")
    .select("job_id")
    .eq("user_id", user.id);

  const savedIds = new Set((savedApps ?? []).map((a) => a.job_id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Job feed</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add jobs manually or bulk-import a feed. Run the agents on any role to
        score fit, tailor documents, and prep.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="space-y-3">
            {(jobs ?? []).map((job) => (
              <li key={job.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-lg font-semibold text-slate-900 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>
                  {savedIds.has(job.id) ? (
                    <Link
                      href="/applications"
                      className="shrink-0 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                    >
                      In pipeline
                    </Link>
                  ) : (
                    <AddToPipelineButton jobId={job.id} />
                  )}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  {job.description}
                </p>
              </li>
            ))}
            {(jobs ?? []).length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No jobs yet. Add one manually or use the ingest endpoint.
              </p>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <JobForm />
          <JobFeedImporter />
        </div>
      </div>
    </main>
  );
}
