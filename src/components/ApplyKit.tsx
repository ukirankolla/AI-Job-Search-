"use client";

import { useState } from "react";
import Link from "next/link";
import { AgentRunner } from "@/components/AgentRunner";
import { ApplyButton } from "@/components/ApplyButton";
import { classifyApplySource } from "@/lib/jobs/applySource";
import type { SubscriptionTier, UsageSnapshot } from "@/lib/subscription";

interface Props {
  jobId: string;
  jobUrl?: string;
  applicationId?: string | null;
  matchScore?: number | null;
  hasResume: boolean;
  tier?: SubscriptionTier;
  admin?: boolean;
  usage?: UsageSnapshot;
  limit?: number;
}

export function ApplyKit({
  jobId,
  jobUrl,
  applicationId,
  matchScore,
  hasResume,
  tier = "free",
  admin = false,
  usage,
  limit,
}: Props) {
  const [resume, setResume] = useState<string | null>(null);
  const [autoApply, setAutoApply] = useState(false);
  const [copied, setCopied] = useState(false);

  const applyLabel = (() => {
    switch (classifyApplySource(jobUrl)) {
      case "linkedin":
        return "Apply on LinkedIn ↗";
      case "company":
        return "Apply on company site ↗";
      case "board":
        return "Apply on job board ↗";
      default:
        return undefined;
    }
  })();

  const copyResume = async () => {
    if (!resume) return;
    await navigator.clipboard.writeText(resume);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadResume = () => {
    if (!resume) return;
    const blob = new Blob([resume], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored-resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const unlimited = tier === "premium" || admin;

  if (!hasResume) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Resume &amp; apply</h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload your resume to see your match % for this job and get an
          ATS-friendly rewrite.{" "}
          <a href="/profile" className="underline hover:text-slate-900">
            Go to Profile →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Resume &amp; apply</h2>
        {matchScore !== null && matchScore !== undefined && (
          <span className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white">
            Match {matchScore}%
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AgentRunner
          jobId={jobId}
          applicationId={applicationId ?? undefined}
          runType="apply"
          label="Update resume for this job"
          onDone={(results) => {
            const tailor = (results as { tailor?: { resume?: string } }).tailor;
            if (tailor?.resume) setResume(tailor.resume);
          }}
        />
        {!unlimited && usage && limit && (
          <span className="text-xs text-slate-400">
            {limit - usage.resume_rewrite} resume rewrite
            {limit - usage.resume_rewrite === 1 ? "" : "s"} left this week
          </span>
        )}
      </div>

      {resume && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-700">
              ATS-friendly resume rewritten for this job.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadResume}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
              >
                Download
              </button>
              <button
                type="button"
                onClick={copyResume}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
              >
                {copied ? "Copied!" : "Copy resume"}
              </button>
            </div>
          </div>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
            {resume}
          </pre>
        </div>
      )}

      {jobUrl && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
            />
            Auto-apply for me
          </label>
          {autoApply && (
            <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
              We’ll open the official application page with your tailored resume
              and cover letter ready — one click and you’re submitted. (Some
              sites don’t allow fully automated submissions, so this is the
              fastest, safest path that works everywhere.)
            </p>
          )}
          {jobUrl && (
            <ApplyButton jobId={jobId} url={jobUrl} autoApply={autoApply} label={applyLabel} />
          )}
          <p className="mt-2 text-xs text-slate-400">
            Opens the original posting on the company or job-board career site.
          </p>
          {!unlimited && usage && limit && (
            <p className="mt-1 text-xs text-slate-400">
              {limit - usage.apply} in-app apply
              {limit - usage.apply === 1 ? "" : "s"} left this week ·{" "}
              <Link href="/upgrade" className="underline">
                Go premium for unlimited
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
