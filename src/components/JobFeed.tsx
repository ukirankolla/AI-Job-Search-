"use client";

import { useMemo, useState } from "react";
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

export function JobFeed({
  jobs,
  savedIds,
}: {
  jobs: JobFeedItem[];
  savedIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [recentOnly, setRecentOnly] = useState(false);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const filtered = useMemo(() => {
    const searched = filterJobs(jobs, query);
    return recentOnly
      ? searched.filter((j) => isRecentlyPosted(j.posted_at, 8))
      : searched;
  }, [jobs, query, recentOnly]);

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
        <button
          type="button"
          onClick={() => setRecentOnly((v) => !v)}
          aria-pressed={recentOnly}
          className={`shrink-0 rounded-md border px-3 py-2 text-sm transition ${
            recentOnly
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Last 8 hours
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {filtered.map((job) => (
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
              {saved.has(job.id) ? (
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
      </ul>

      {jobs.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No jobs yet. Fresh postings are pulled in automatically — or add one
          manually, load the sample jobs, or bulk-import a feed.
        </p>
      )}
      {jobs.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {recentOnly
            ? "No jobs posted in the last 8 hours yet. Check back soon."
            : `No jobs match "${query}".`}
        </p>
      )}
    </div>
  );
}
