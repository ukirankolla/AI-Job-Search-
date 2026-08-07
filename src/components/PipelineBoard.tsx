"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { filterApplications } from "@/lib/applicationFilter";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusSelect } from "@/components/StatusSelect";
import { CardAnalyzeButton } from "@/components/CardAnalyzeButton";
import type { ApplicationStatus } from "@/lib/types";

export interface PipelineCard {
  id: string;
  job_id: string | null;
  status: ApplicationStatus;
  match_score: number | null;
  deadline: string | null;
  title: string;
  company: string;
  url: string | null;
}

const columns: { status: ApplicationStatus; label: string }[] = [
  { status: "saved", label: "Saved" },
  { status: "applied", label: "Applied" },
  { status: "interviewing", label: "Interviewing" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Rejected" },
];

export function PipelineBoard({ apps }: { apps: PipelineCard[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterApplications(apps, query),
    [apps, query],
  );
  const hasQuery = query.trim().length > 0;

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {apps.length} tracked. Move cards between stages as you progress.
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, status, or score…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-slate-400 focus:outline-none sm:w-72"
        />
      </div>

      {hasQuery && filtered.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No applications match “{query.trim()}”.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {columns.map((col) => {
            const inCol = filtered.filter((a) => a.status === col.status);
            return (
              <section
                key={col.status}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">
                    {col.label}
                  </h2>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                    {inCol.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {inCol.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <Link
                        href={`/applications/${a.id}`}
                        className="block font-medium text-slate-900 hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {a.company}
                        {a.deadline && (
                          <span className="text-slate-400">
                            {" · "}
                            Due{" "}
                            {new Date(`${a.deadline}T00:00:00`).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={a.status} />
                        <div className="flex items-center gap-2">
                          {a.match_score !== null && (
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
                          {a.job_id && (
                            <CardAnalyzeButton
                              jobId={a.job_id}
                              applicationId={a.id}
                            />
                          )}
                        </div>
                      </div>
                      <div className="mt-2 border-t border-slate-100 pt-2">
                        <StatusSelect applicationId={a.id} />
                      </div>
                    </li>
                  ))}
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
      )}
    </div>
  );
}
