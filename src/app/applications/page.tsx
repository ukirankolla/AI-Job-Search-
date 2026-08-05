import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard, type PipelineCard } from "@/components/PipelineBoard";
import type { ApplicationStatus } from "@/lib/types";

export const metadata = { title: "Pipeline | Noventra" };

export default async function ApplicationsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, job_id, status, match_score, deadline, custom_title, job:jobs(title, company, url)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

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
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Application pipeline</h1>
      <PipelineBoard apps={apps} />
    </main>
  );
}
