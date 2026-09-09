"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { filterJobs } from "@/lib/jobFilter";
import { formatRelativeTime, isRecentlyPosted } from "@/lib/jobTime";
import type { ApplySourceKind } from "@/lib/jobs/applySource";
import { AddToPipelineButton } from "@/components/AddToPipelineButton";
import { SourceBadge } from "@/components/SourceBadge";

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
  if (score >= 70) return "bg-emerald-500/10 text-emerald-300 border-emerald-400/30";
  if (score >= 40) return "bg-amber-500/10 text-amber-300 border-amber-400/30";
  return "bg-rose-500/10 text-rose-300 border-rose-400/30";
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
  const [hours, setHours] = useState<number | null>(null);
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
  const isInitialMount = useRef(true);

  const performSearchInternal = async (
    searchQuery: string,
    searchHours: number | null,
    searchTypes: string[],
    searchSponsorship: "yes" | "no" | null,
  ) => {
    if (searching) return;
    setSearching(true);
    setSearchError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          hours: searchHours,
          types: searchTypes,
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
        const hasLocalMatches = filterJobs(jobs, searchQuery).length > 0;
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

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(draft);
    await performSearchInternal(draft, hours, types, sponsorship);
  };

  // Auto-search when filters change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!query) return; // Only auto-search if there's an active query

    const timer = setTimeout(() => {
      performSearchInternal(query, hours, types, sponsorship);
    }, 300);

    return () => clearTimeout(timer);
  }, [hours, types, sponsorship, directOnly, query, locationDraft]);

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
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search by title, company, location, skills…"
                className="w-full rounded-lg border border-white/10 bg-[#0b1120]/80 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Search jobs"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50"
            >
              {searching ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Searching…
                </span>
              ) : (
                "Search jobs"
              )}
            </button>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDraft("");
                }}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex w-full items-center gap-2">
            <span className="pointer-events-none text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              value={locationDraft}
              onChange={(e) => setLocationDraft(e.target.value)}
              placeholder="Location (e.g. United States, Austin TX)"
              className="w-full rounded-lg border border-white/10 bg-[#0b1120]/60 px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Job location"
            />
          </div>
        </form>
        <div
          className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-[#0b1120]/80 p-1 text-sm"
          role="group"
          aria-label="Posted within"
        >
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setHours(opt.hours)}
              aria-pressed={hours === opt.hours}
              className={`rounded-md px-2.5 py-1 transition ${
                hours === opt.hours
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-600/25"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {searchError && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {searchError}
        </p>
      )}

      {notice && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          {notice}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
        <fieldset className="flex items-center gap-1.5">
          <legend className="mr-1 font-medium text-slate-500">Type</legend>
          {TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 transition ${
                types.includes(opt.value)
                  ? "border-indigo-400/40 bg-indigo-500/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
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
                  ? "border-indigo-400/40 bg-indigo-500/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
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
            className="h-3.5 w-3.5 accent-indigo-500"
          />
          <span className="font-medium text-slate-300">
            Company / LinkedIn only
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {hasResume && unmatchable && (
          <button
            type="button"
            onClick={matchAll}
            disabled={matching}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50"
          >
            {matching ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Matching with your resume…
              </span>
            ) : (
              "Match all with my resume"
            )}
          </button>
        )}
        <button
          type="button"
          onClick={refreshIndex}
          disabled={indexing}
          className="rounded-lg border border-white/10 bg-[#0b1120]/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
        >
          {indexing ? "Updating company index…" : "Update company index"}
        </button>
        {!hasResume && (
          <p className="text-xs text-slate-500">
            Upload your resume in{" "}
            <a href="/profile" className="text-indigo-400 underline hover:text-indigo-300">
              Profile
            </a>{" "}
            to see your match % for every job.
          </p>
        )}
      </div>

      {jobs.length > 0 && (
        <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
          <span className="text-slate-700">·</span>
          <span>
            Showing {filtered.length} of {jobs.length} agent-verified postings
          </span>
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {filtered.map((job) => {
          const score = scores?.[job.id];
          return (
            <li key={job.id} className="rounded-2xl border border-white/10 bg-[#0b1120]/60 p-5 backdrop-blur transition hover:border-white/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-lg font-semibold text-white hover:text-indigo-300"
                  >
                    {job.title}
                  </Link>
                  <p className="text-sm text-slate-400">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""}
                    {isRecentlyPosted(job.posted_at, 8) && (
                      <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        New
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {job.posted_at && (
                      <span>Posted {formatRelativeTime(job.posted_at)}</span>
                    )}
                    {job.employment_type && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 capitalize text-slate-300">
                        {job.employment_type.replace("_", "-")}
                      </span>
                    )}
                    {job.sponsorship && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">
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
                        className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300"
                      >
                        Verified
                      </span>
                    )}
                    {job.verified_status === "likely" && (
                      <span
                        title="Company career site found; exact posting not confirmed"
                        className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-300"
                      >
                        Likely genuine
                      </span>
                    )}
                    {job.verified_status === "unverified" && (
                      <span
                        title="No company-owned posting found"
                        className="rounded-full bg-white/5 px-2 py-0.5 text-slate-500"
                      >
                        Unverified
                      </span>
                    )}
                    <SourceBadge source={job.source ?? "search"} />
                    {job.applyKind === "linkedin" && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-400">
                        Search result
                      </span>
                    )}
                    {job.applyKind === "company" && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
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
                      className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      In pipeline
                    </Link>
                  ) : (
                    <AddToPipelineButton jobId={job.id} />
                  )}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                {job.description}
              </p>
            </li>
          );
        })}
      </ul>

      {jobs.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 bg-[#0b1120]/40 p-8 text-center text-sm text-slate-500">
          No jobs yet. Click Search jobs to pull live postings from LinkedIn and
          company career sites, or add one manually, load the sample jobs, or
          bulk-import a feed.
        </p>
      )}
      {jobs.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 bg-[#0b1120]/40 p-8 text-center text-sm text-slate-500">
          No jobs match the current filters. Try widening the time window or
          clearing a filter.
        </p>
      )}
    </div>
  );
}