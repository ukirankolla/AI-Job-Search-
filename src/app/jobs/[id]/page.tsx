import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AgentRunner } from "@/components/AgentRunner";
import { AddToPipelineButton } from "@/components/AddToPipelineButton";
import { DeleteJobButton } from "@/components/DeleteJobButton";

export const metadata = { title: "Job | AI Job Search" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const { data: app } = await supabase
    .from("applications")
    .select("id, status, match_score")
    .eq("job_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/jobs" className="text-sm text-slate-500 hover:underline">
        ← Back to jobs
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-slate-500">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
            {job.salary_min ? ` · $${job.salary_min.toLocaleString()}${job.salary_max ? `–$${job.salary_max.toLocaleString()}` : "+"}` : ""}
          </p>
        </div>
        {app?.match_score !== null && app?.match_score !== undefined && (
          <span className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
            Match {app.match_score}/100
          </span>
        )}
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 font-semibold text-slate-900">Agents</h2>
          <p className="mb-3 text-sm text-slate-500">
            Run the agents to score your fit, then hit{" "}
            <span className="font-medium text-slate-700">Apply now</span> to open
            the official application page with your tailored documents ready.
          </p>
          <div className="flex flex-wrap gap-3">
            <AgentRunner jobId={id} applicationId={app?.id} runType="analyze" label="Analyze fit" />
            <AgentRunner jobId={id} applicationId={app?.id} runType="apply" label="Tailor + prep" />
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Apply now ↗
              </a>
            ) : null}
            {app ? (
              <Link
                href={`/applications/${app.id}`}
                className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Open in pipeline →
              </Link>
            ) : (
              <AddToPipelineButton jobId={id} />
            )}
          </div>
          {job.source === "manual" && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <DeleteJobButton jobId={id} />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-slate-900">Job description</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {job.description}
          </div>
        </div>
      </div>
    </main>
  );
}
