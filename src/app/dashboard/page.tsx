import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationsList } from "@/components/NotificationsList";
import { QuestCard } from "@/components/QuestCard";
import type { Notification } from "@/lib/types";

export const metadata = { title: "Dashboard | Noventra" };

const statIcons = {
  pipeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h16M4 19h10" />
    </svg>
  ),
  applied: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  ),
  interviews: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h5" />
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  ),
  match: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.7-6.7-1.4 1.4M6.7 17.3l-1.4 1.4m12.7 0-1.4-1.4M6.7 6.7 5.3 5.3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
};

export default async function DashboardPage() {
  const user = await requireOnboarded();
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
    { key: "pipeline" as const, label: "In pipeline", value: apps.length },
    { key: "applied" as const, label: "Applied", value: countBy("applied") },
    { key: "interviews" as const, label: "Interviews", value: countBy("interviewing") },
    { key: "match" as const, label: "Avg match", value: avgScore === null ? "—" : `${avgScore}%` },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your search at a glance — match, apply, and follow up.
          </p>
        </div>
        <Link
          href="/jobs"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500"
        >
          Browse jobs →
        </Link>
      </div>

      {!hasResume && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-600/20">
          <p className="text-lg font-semibold">Let’s get started — upload your resume once.</p>
          <p className="mt-1 max-w-2xl text-sm text-indigo-100">
            Your resume powers everything: matching fresh job postings, skill-gap
            guidance, and tailored resumes and cover letters.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Upload my resume →
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-50 text-slate-500">
                {statIcons[s.key]}
              </span>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <QuestCard userId={user.id} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Recent applications
          </h2>
          {apps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 7.5 9l3.5 3.5L18 5m0 0h-4m4 0v4" />
                </svg>
              </div>
              <p className="mt-3">No applications yet.</p>
              <Link
                href="/jobs"
                className="mt-2 inline-block font-medium text-indigo-600 underline hover:text-indigo-700"
              >
                Start matching jobs →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {apps.map((a) => {
                const job = a.job as { title?: string; company?: string } | null;
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between px-5 py-3.5 transition hover:bg-slate-50"
                  >
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
