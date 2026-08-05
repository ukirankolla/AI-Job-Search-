import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AgentRunner } from "@/components/AgentRunner";
import { AddToPipelineButton } from "@/components/AddToPipelineButton";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { ApplyKit } from "@/components/ApplyKit";

export const metadata = { title: "Job | Noventra" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireOnboarded();
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_text")
    .eq("id", user.id)
    .maybeSingle();

  const { data: jobMatch } = await supabase
    .from("job_matches")
    .select("score")
    .eq("job_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const matchScore = jobMatch?.score ?? app?.match_score ?? null;
  const hasResume = Boolean(profile?.resume_text?.trim());

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
        {matchScore !== null && (
          <span className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
            Match {matchScore}/100
          </span>
        )}
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 font-semibold text-slate-900">Agents</h2>
          <p className="mb-3 text-sm text-slate-500">
            Deep-dive the role: analyze your fit, tailor your documents, and
            prep for the interview.
          </p>
          <div className="flex flex-wrap gap-3">
            <AgentRunner jobId={id} applicationId={app?.id} runType="analyze" label="Analyze fit" />
            <AgentRunner jobId={id} applicationId={app?.id} runType="apply" label="Tailor + prep" />
            <AgentRunner jobId={id} applicationId={app?.id} runType="prep" label="Prep only" />
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

        <ApplyKit
          jobId={id}
          jobUrl={job.url || undefined}
          applicationId={app?.id}
          matchScore={matchScore}
          hasResume={hasResume}
        />

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
