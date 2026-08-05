import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationsList } from "@/components/NotificationsList";
import type { Notification } from "@/lib/types";

export const metadata = { title: "Dashboard | JobOrbit" };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [
    { data: applications },
    { data: notifications },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, match_score, deadline, created_at, job:jobs(title, company)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const apps = applications ?? [];
  const notifs = notifications ?? [];
  const hasResume = Boolean(profile?.resume_text?.trim());
  const countBy = (s: string) => apps.filter((a) => a.status === s).length;
  const scores = apps.map((a) => a.match_score).filter((n): n is number => n !== null);
  const avgScore = scores.length
    ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
    : null;

  const stats = [
    { label: "In pipeline", value: apps.length },
    { label: "Applied", value: countBy("applied") },
    { label: "Interviews", value: countBy("interviewing") },
    { label: "Avg match", value: avgScore === null ? "—" : `${avgScore}%` },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <Link
          href="/jobs"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Browse jobs
        </Link>
      </div>

      {!hasResume && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-lg font-semibold text-emerald-900">
            Let’s get started — upload your resume once.
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Your resume powers everything: matching fresh job postings, skill-gap
            guidance, and tailored resumes and cover letters.
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Upload my resume →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Recent applications
          </h2>
          {apps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              <p className="text-3xl">🎯</p>
              <p className="mt-2">No applications yet.</p>
              <Link href="/jobs" className="mt-2 inline-block font-medium text-slate-900 underline">
                Start matching jobs →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {apps.map((a) => {
                const job = a.job as { title?: string; company?: string } | null;
                return (
                  <li key={a.id} className="flex items-center justify-between px-4 py-3">
                    <Link href={`/applications/${a.id}`} className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {job?.title ?? "Untitled role"}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {job?.company ?? "—"}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={a.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Agent alerts
          </h2>
          <NotificationsList
            notifications={notifs as Notification[]}
          />
        </section>
      </div>
    </main>
  );
}
