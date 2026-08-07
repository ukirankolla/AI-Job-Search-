"use client";

import { useState } from "react";
import Link from "next/link";
import { applyForJob } from "@/app/actions/subscription";

interface Props {
  jobId: string;
  url: string;
}

export function ApplyButton({ jobId, url }: Props) {
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    const result = await applyForJob(jobId, url);
    setBusy(false);
    if (result.ok) {
      window.open(result.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (result.limitReached) {
      setBlocked(true);
      setMessage(null);
      return;
    }
    setMessage(result.message ?? "Something went wrong.");
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? "Checking…" : "Apply ↗"}
      </button>

      {blocked && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          You’ve hit your free weekly apply limit.{" "}
          <Link href="/upgrade" className="font-semibold underline">
            Upgrade to premium →
          </Link>
        </div>
      )}
      {message && (
        <p className="mt-2 text-sm text-rose-600">{message}</p>
      )}
    </div>
  );
}
