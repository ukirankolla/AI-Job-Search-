"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { filterJobs } from "@/lib/jobFilter";
import { formatRelativeTime, isRecentlyPosted } from "@/lib/jobTime";
import { AddToPipelineButton } from "@/components/AddToPipelineButton";

export interface JobFeedItem {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number | null;
  salary_max?: number | null;
  posted_at?: string | null;
}

const TIME_OPTIONS = [
  { label: "All", hours: null },
  { label: "12h", hours: 12 },
  { label: "8h", hours: 8 },
  { label: "4h", hours: 4 },
];

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-50 text-emerald-700 border-emerald-300";
  if (score >= 40) return "bg-amber-50 text-amber-700 border-amber-300";
  return "bg-rose-50 text-rose-700 border-rose-300";
}

export function JobFeed({
  jobs,
  savedIds,
  scores,
  hasResume,
}: {
  jobs: JobFeedItem[];
  savedIds: string[];
  scores?: Record<string, number>;
  hasResume?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hours, setHours] = useState<number | null>(8);
  const [matching, setMatching] = useState(false);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const filtered = useMemo(() => {
    const searched = filterJobs(jobs, query);
    return hours === null
      ? searched
      : searched.filter((j) => isRecentlyPosted(j.posted_at, hours));
  }, [jobs, query, hours]);

  const unmatchable = jobs.some((j) => !scores?.[j.id]);

  const matchAll = async () => {
    if (matching) return;
    const missingIds = jobs
      .filter((j) => !scores?.[j.id])
      .map((j) => j.id)
      .slice(0, 50);
    if (missingIds.length === 0) return;
    setMatching(true);
    try {
      await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: missingIds }),
      });
      router.refresh();
    } finally {
      setMatching(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, location, skills…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          aria-label="Search jobs"
        />
        <div
          className="flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white p-1 text-sm"
          role="group"
          aria-label="Posted within"
        >
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setHours(opt.hours)}
              aria-pressed={hours === opt.hours}
              className={`rounded px-2.5 py-1 transition ${
                hours === opt.hours
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {hasResume && unmatchable && (
          <button
            type="button"
            onClick={matchAll}
            disabled={matching}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {matching ? "Matching with your resume…" : "Match all with my resume"}
          </button>
        )}
        {!hasResume && (
          <p className="text-xs text-slate-400">
            Upload your resume in{" "}
            <a href="/profile" className="underline hover:text-slate-600">
              Profile
            </a>{" "}
            to see your match % for every job.
          </p>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {filtered.map((job) => {
          const score = scores?.[job.id];
          return (
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
                    {isRecentlyPosted(job.posted_at, 8) && (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        New
                      </span>
                    )}
                  </p>
                  {job.posted_at && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Posted {formatRelativeTime(job.posted_at)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {score !== undefined && (
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${scoreTone(score)}`}
                      title={`${score}% match to your resume`}
                    >
                      Match {score}%
                    </span>
                  )}
                  {saved.has(job.id) ? (
                    <Link
                      href="/applications"
                      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                    >
                      In pipeline
                    </Link>
                  ) : (
                    <AddToPipelineButton jobId={job.id} />
                  )}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                {job.description}
              </p>
            </li>
          );
        })}
      </ul>

      {jobs.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No jobs yet. Fresh postings are pulled in automatically — or add one
          manually, load the sample jobs, or bulk-import a feed.
        </p>
      )}
      {jobs.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {hours === null
            ? `No jobs match "${query}".`
            : `No jobs posted in the last ${hours} hours. Try a wider window.`}
        </p>
      )}
    </div>
  );
}
