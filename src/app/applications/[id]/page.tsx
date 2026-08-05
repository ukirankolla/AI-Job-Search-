import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AgentRunner } from "@/components/AgentRunner";
import { StatusSelect } from "@/components/StatusSelect";
import type { InterviewPrep } from "@/lib/types";

export const metadata = { title: "Application | AI Job Search" };

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!app) notFound();

  const { data: job } = app.job_id
    ? await supabase.from("jobs").select("*").eq("id", app.job_id).single()
    : { data: null };

  const [{ data: docs }, { data: preps }, { data: runs }] = await Promise.all([
    supabase
      .from("tailored_documents")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("interview_preps")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("agent_runs")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const resume = docs?.find((d) => d.doc_type === "resume");
  const coverLetter = docs?.find((d) => d.doc_type === "cover_letter");
  const prep = preps?.[0] as InterviewPrep | undefined;
  const runHistory = runs ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/applications" className="text-sm text-slate-500 hover:underline">
        ← Back to pipeline
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {job?.title ?? app.custom_title ?? "Untitled role"}
          </h1>
          <p className="text-slate-500">
            {job?.company ?? app.custom_company ?? "—"}
            {app.deadline ? ` · deadline ${new Date(app.deadline).toLocaleDateString()}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {app.match_score !== null && (
            <span className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
              Match {app.match_score}/100
            </span>
          )}
          <StatusSelect applicationId={app.id} />
        </div>
      </div>

      {app.match_reason && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Matcher: </span>
          {app.match_reason}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Agents</h2>
        {app.job_id ? (
          <>
            <div className="flex flex-wrap gap-3">
              <AgentRunner jobId={app.job_id} applicationId={id} runType="analyze" label="Re-analyze" />
              <AgentRunner jobId={app.job_id} applicationId={id} runType="apply" label="Tailor docs + prep" />
              <AgentRunner jobId={app.job_id} applicationId={id} runType="prep" label="Prep only" />
            </div>
            <Link
              href={`/jobs/${app.job_id}`}
              className="mt-3 inline-block text-sm text-slate-500 underline hover:text-slate-900"
            >
              View job posting →
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            This application has no linked job posting, so agents can&apos;t run on it.
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-slate-900">Tailored resume</h2>
          {resume ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-700">{resume.content}</pre>
          ) : (
            <Empty label="No tailored resume yet — run 'Tailor docs + prep'." />
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-slate-900">Cover letter</h2>
          {coverLetter ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-700">{coverLetter.content}</pre>
          ) : (
            <Empty label="No cover letter yet." />
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Interview prep</h2>
        {prep ? (
          <div className="space-y-4">
            {prep.content.summary && (
              <p className="text-sm text-slate-600">{prep.content.summary}</p>
            )}
            {prep.content.questions?.map((q, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-4">
                <p className="font-medium text-slate-900">
                  Q{i + 1}. {q.question}
                </p>
                <p className="mt-2 text-sm text-slate-600">{q.answer}</p>
                {q.tip && (
                  <p className="mt-2 text-xs text-slate-400">💡 {q.tip}</p>
                )}
              </div>
            ))}
            {prep.content.tips?.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {prep.content.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Empty label="No interview prep yet." />
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Agent run history</h2>
        {runHistory.length === 0 ? (
          <Empty label="No agent runs yet." />
        ) : (
          <ul className="space-y-2">
            {runHistory.map((run) => (
              <li key={run.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="text-slate-700">
                  {run.run_type} ·{" "}
                  {new Date(run.created_at).toLocaleString()}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    run.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : run.status === "failed"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {run.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}
