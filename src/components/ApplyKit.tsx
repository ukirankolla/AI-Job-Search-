"use client";

import { useState } from "react";
import { AgentRunner } from "@/components/AgentRunner";

interface Props {
  jobId: string;
  jobUrl?: string;
  applicationId?: string | null;
  matchScore?: number | null;
  hasResume: boolean;
}

export function ApplyKit({
  jobId,
  jobUrl,
  applicationId,
  matchScore,
  hasResume,
}: Props) {
  const [resume, setResume] = useState<string | null>(null);
  const [autoApply, setAutoApply] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyResume = async () => {
    if (!resume) return;
    await navigator.clipboard.writeText(resume);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!hasResume) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
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
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Resume &amp; apply</h2>
        {matchScore !== null && matchScore !== undefined && (
          <span className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
            Match {matchScore}%
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
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
      </div>

      {resume && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-700">
              ATS-friendly resume rewritten for this job.
            </p>
            <button
              type="button"
              onClick={copyResume}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
            >
              {copied ? "Copied!" : "Copy resume"}
            </button>
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
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            {autoApply ? "Auto-apply now ↗" : "Apply now ↗"}
          </a>
          <p className="mt-2 text-xs text-slate-400">
            Opens the original posting on the company or job-board career site.
          </p>
        </div>
      )}
    </div>
  );
}
