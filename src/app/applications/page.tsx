import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusSelect } from "@/components/StatusSelect";
import type { ApplicationStatus } from "@/lib/types";

export const metadata = { title: "Pipeline | AI Job Search" };

const columns: { status: ApplicationStatus; label: string }[] = [
  { status: "saved", label: "Saved" },
  { status: "applied", label: "Applied" },
  { status: "interviewing", label: "Interviewing" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Rejected" },
];

export default async function ApplicationsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, match_score, deadline, custom_title, job:jobs(title, company, url)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const apps = applications ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Application pipeline</h1>
      <p className="mt-1 text-sm text-slate-500">
        {apps.length} tracked. Move cards between stages as you progress.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {columns.map((col) => {
          const inCol = apps.filter((a) => a.status === col.status);
          return (
            <section key={col.status} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  {col.label}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                  {inCol.length}
                </span>
              </div>
              <ul className="space-y-2">
                {inCol.map((a) => {
                  const job = a.job as {
                    title?: string;
                    company?: string;
                    url?: string;
                  } | null;
                  return (
                    <li key={a.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <Link
                        href={`/applications/${a.id}`}
                        className="block font-medium text-slate-900 hover:underline"
                      >
                        {job?.title ?? a.custom_title ?? "Untitled role"}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {job?.company ?? "—"}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={a.status} />
                        <div className="flex items-center gap-2">
                          {a.match_score !== null && a.match_score !== undefined && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                a.match_score >= 70
                                  ? "bg-emerald-100 text-emerald-700"
                                  : a.match_score >= 40
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {a.match_score}
                            </span>
                          )}
                          <StatusSelect applicationId={a.id} />
                        </div>
                      </div>
                    </li>
                  );
                })}
                {inCol.length === 0 && (
                  <li className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400">
                    empty
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
