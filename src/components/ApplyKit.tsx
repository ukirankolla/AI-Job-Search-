"use client";

import { useState } from "react";
import Link from "next/link";
import { AgentRunner } from "@/components/AgentRunner";
import { ApplyButton } from "@/components/ApplyButton";
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
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyResume = async () => {
    if (!resume) return;
    await navigator.clipboard.writeText(resume);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadResume = async () => {
    if (!resume || downloading) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = doc.internal.pageSize.getHeight();
      const lines = doc.splitTextToSize(resume, pageWidth) as string[];
      let y = margin;
      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 5;
      }
      doc.save("tailored-resume.pdf");
    } finally {
      setDownloading(false);
    }
  };

  const unlimited = tier === "premium" || admin;
  const isLinkedInTarget = Boolean(jobUrl && /linkedin\.com/i.test(jobUrl));

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
                disabled={downloading}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {downloading ? "Preparing…" : "Download"}
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
          <ApplyButton jobId={jobId} url={jobUrl} />
          <p className="mt-2 text-xs text-slate-400">
            {isLinkedInTarget
              ? "LinkedIn doesn't reveal the company's direct apply link to logged-out visitors, so this opens the LinkedIn posting — use its Apply button to reach the company's career site."
              : "Opens the company's own career site so you can apply directly."}
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
