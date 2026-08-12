import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAutoApplySettings } from "@/lib/autoApply";
import { PipelineBoard, type PipelineCard } from "@/components/PipelineBoard";
import { AutoApplySettings } from "@/components/AutoApplySettings";
import type { ApplicationStatus } from "@/lib/types";

export const metadata = { title: "Pipeline | Noventra" };

export default async function ApplicationsPage() {
  const user = await requireOnboarded();
  const supabase = await createClient();

  const [{ data: applications }, settings, { data: lastRunRows }, { count }] =
    await Promise.all([
      supabase
        .from("applications")
        .select(
          "id, job_id, status, match_score, deadline, custom_title, origin, auto_status, job:jobs(title, company, url)",
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      getAutoApplySettings(user.id),
      supabase
        .from("auto_apply_log")
        .select(
          "ran_at, considered, matched, submitted, ready, skipped, failed",
        )
        .eq("user_id", user.id)
        .order("ran_at", { ascending: false })
        .limit(1),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("origin", "auto")
        .eq("auto_status", "ready"),
    ]);

  const apps: PipelineCard[] = (applications ?? []).map((a) => {
    const job = a.job as {
      title?: string;
      company?: string;
      url?: string;
    } | null;
    return {
      id: a.id,
      job_id: a.job_id,
      status: a.status as ApplicationStatus,
      match_score: a.match_score,
      deadline: a.deadline,
      title: job?.title ?? a.custom_title ?? "Untitled role",
      company: job?.company ?? "—",
      url: job?.url ?? null,
      origin: a.origin,
      auto_status: a.auto_status,
    };
  });

  const lastRun = lastRunRows?.[0] ?? null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
        Pipeline
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        Application pipeline
      </h1>

      <AutoApplySettings
        settings={settings}
        readyCount={count ?? 0}
        lastRun={
          lastRun
            ? {
                ran_at: lastRun.ran_at as string,
                considered: lastRun.considered as number,
                matched: lastRun.matched as number,
                submitted: lastRun.submitted as number,
                ready: lastRun.ready as number,
                skipped: lastRun.skipped as number,
                failed: lastRun.failed as number,
              }
            : null
        }
      />

      <PipelineBoard apps={apps} />
    </main>
  );
}
