"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { filterJobs } from "@/lib/jobFilter";
import { AddToPipelineButton } from "@/components/AddToPipelineButton";

export interface JobFeedItem {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number | null;
  salary_max?: number | null;
}

export function JobFeed({
  jobs,
  savedIds,
}: {
  jobs: JobFeedItem[];
  savedIds: string[];
}) {
  const [query, setQuery] = useState("");
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const filtered = useMemo(() => filterJobs(jobs, query), [jobs, query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, company, location, skills…"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        aria-label="Search jobs"
      />

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
                </p>
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
          No jobs yet. Load the sample jobs, add one manually, or bulk-import a
          feed.
        </p>
      )}
      {jobs.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No jobs match “{query}”.
        </p>
      )}
    </div>
  );
}
