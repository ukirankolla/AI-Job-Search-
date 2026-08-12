"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { filterJobs } from "@/lib/jobFilter";
import { formatRelativeTime, isRecentlyPosted } from "@/lib/jobTime";
import type { ApplySourceKind } from "@/lib/jobs/applySource";
import { AddToPipelineButton } from "@/components/AddToPipelineButton";
import { getJobSourceLabel } from "@/lib/jobs/pipelineEligibility";

export interface JobFeedItem {
  id: string;
  source?: string | null;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number | null;
  salary_max?: number | null;
  posted_at?: string | null;
  employment_type?: string | null;
  sponsorship?: string | null;
  applyKind?: ApplySourceKind;
  verified_status?: "verified" | "likely" | "unverified" | null;
  verified_source_url?: string | null;
}

const TIME_OPTIONS = [
  { label: "All", hours: null },
  { label: "12h", hours: 12 },
  { label: "8h", hours: 8 },
  { label: "4h", hours: 4 },
];

const TYPE_OPTIONS = [
  { value: "w2", label: "W2" },
  { value: "c2c", label: "C2C" },
  { value: "full_time", label: "Full-time" },
  { value: "internship", label: "Internship" },
];

const SPONSORSHIP_OPTIONS = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
];

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-50 text-emerald-700 border-emerald-300";
  if (score >= 40) return "bg-amber-50 text-amber-700 border-amber-300";
  return "bg-rose-50 text-rose-700 border-rose-300";
}

function isDirect(kind?: ApplySourceKind) {
  return kind === "linkedin" || kind === "company";
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
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hours, setHours] = useState<number | null>(8);
  const [types, setTypes] = useState<string[]>([]);
  const [sponsorship, setSponsorship] = useState<"yes" | "no" | null>(null);
  const [directOnly, setDirectOnly] = useState(true);
  const [matching, setMatching] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [locationDraft, setLocationDraft] = useState("United States");
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  const filtered = useMemo(() => {
    return filterJobs(jobs, query).filter((job) => {
      if (hours !== null && !isRecentlyPosted(job.posted_at, hours)) return false;
      if (types.length > 0 && !types.includes(job.employment_type ?? "")) {
        return false;
      }
      if (sponsorship !== null && job.sponsorship !== null && job.sponsorship !== sponsorship) {
        return false;
      }
      if (directOnly && !isDirect(job.applyKind)) return false;
      return true;
    });
  }, [jobs, query, hours, types, sponsorship, directOnly]);

  const toggleType = (value: string) => {
    setTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const unmatchable = jobs.some((j) => !scores?.[j.id]);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(draft);
    if (searching) return;
    setSearching(true);
    setSearchError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: draft,
          hours,
          types,
          location: locationDraft,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            error?: string;
            found?: number;
            message?: string;
            warnings?: string[];
            sources?: string[];
          }
        | null;
      if (!res.ok) {
        setSearchError(data?.error ?? "Search failed. Please try again.");
        return;
      }
      if (data?.found === 0) {
        const hasLocalMatches = filterJobs(jobs, draft).length > 0;
        if (hasLocalMatches) {
          setNotice(
            "No new postings found for that search — showing existing matches.",
          );
        } else {
          setSearchError(
            data?.message ?? "No jobs found for that search.",
          );
        }
        return;
      }
      if (data?.warnings?.length) {
        setNotice(data.warnings.join(" "));
      }
      router.refresh();
    } catch {
      setSearchError("Network error while searching. Please try again.");
    } finally {
      setSearching(false);
    }
  };

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

  const refreshIndex = async () => {
    if (indexing) return;
    setIndexing(true);
    setSearchError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/jobs/index", { method: "POST" });
      const data = (await res.json().catch(() => null)) as
        | {
            error?: string;
            found?: number;
            errors?: { page: string; message: string }[];
          }
        | null;
      if (!res.ok) {
        setSearchError(data?.error ?? "Index refresh failed. Please try again.");
        return;
      }
      if (data?.errors?.length) {
        setNotice(
          `Indexed ${data.found ?? 0} jobs. ${data.errors.length} career site(s) couldn't be reached.`,
        );
      }
      router.refresh();
    } catch {
      setSearchError("Network error while updating the index.");
    } finally {
      setIndexing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <form
          onSubmit={runSearch}
          className="flex w-full flex-col gap-2"
        >
          <div className="flex w-full items-center gap-2">
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by title, company, location, skills…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Search jobs"
            />
            <button
              type="submit"
              disabled={searching}
              className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {searching ? "Searching jobs…" : "Search jobs"}
            </button>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDraft("");
                }}
                className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="text"
            value={locationDraft}
            onChange={(e) => setLocationDraft(e.target.value)}
            placeholder="Location (e.g. United States, Austin TX)"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
            aria-label="Job location"
          />
        </form>
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
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {searchError && (
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {searchError}
        </p>
      )}

      {notice && (
        <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {notice}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
        <fieldset className="flex items-center gap-1.5">
          <legend className="mr-1 font-medium text-slate-500">Type</legend>
          {TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 transition ${
                types.includes(opt.value)
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={types.includes(opt.value)}
                onChange={() => toggleType(opt.value)}
                className="hidden"
              />
              {opt.label}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex items-center gap-1.5">
          <legend className="mr-1 font-medium text-slate-500">
            Sponsorship
          </legend>
          {SPONSORSHIP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setSponsorship((prev) => (prev === opt.value ? null : opt.value))
              }
              aria-pressed={sponsorship === opt.value}
              className={`rounded-md border px-2 py-1 transition ${
                sponsorship === opt.value
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </fieldset>

        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={directOnly}
            onChange={(e) => setDirectOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-slate-900"
          />
          <span className="font-medium text-slate-500">
            Company / LinkedIn only
          </span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {hasResume && unmatchable && (
          <button
            type="button"
            onClick={matchAll}
            disabled={matching}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {matching ? "Matching with your resume…" : "Match all with my resume"}
          </button>
        )}
        <button
          type="button"
          onClick={refreshIndex}
          disabled={indexing}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {indexing ? "Updating company index…" : "Update company index"}
        </button>
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
            <li key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
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
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {job.posted_at && (
                      <span>Posted {formatRelativeTime(job.posted_at)}</span>
                    )}
                    {job.employment_type && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-600">
                        {job.employment_type.replace("_", "-")}
                      </span>
                    )}
                    {job.sponsorship && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        {job.sponsorship === "yes"
                          ? "Sponsorship available"
                          : "No sponsorship"}
                      </span>
                    )}
                    {job.verified_status === "verified" && (
                      <span
                        title={
                          job.verified_source_url
                            ? `Confirmed on ${job.verified_source_url}`
                            : "Confirmed on the company career site"
                        }
                        className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700"
                      >
                        Verified
                      </span>
                    )}
                    {job.verified_status === "likely" && (
                      <span
                        title="Company career site found; exact posting not confirmed"
                        className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700"
                      >
                        Likely genuine
                      </span>
                    )}
                    {job.verified_status === "unverified" && (
                      <span
                        title="No company-owned posting found"
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500"
                      >
                        Unverified
                      </span>
                    )}
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
                      {getJobSourceLabel(job.source ?? "search")}
                    </span>
                    {job.applyKind === "linkedin" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        Search result
                      </span>
                    )}
                    {job.applyKind === "company" && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
                        Company site
                      </span>
                    )}
                  </p>
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
          No jobs yet. Click Search jobs to pull live postings from LinkedIn and
          company career sites, or add one manually, load the sample jobs, or
          bulk-import a feed.
        </p>
      )}
      {jobs.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No jobs match the current filters. Try widening the time window or
          clearing a filter.
        </p>
      )}
    </div>
  );
}
