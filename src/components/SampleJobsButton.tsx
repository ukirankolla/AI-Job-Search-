"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SAMPLE_JOBS } from "@/lib/sampleJobs";

export function SampleJobsButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/jobs/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: SAMPLE_JOBS }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Failed to load sample jobs.");
        return;
      }
      setMessage(
        `Loaded ${body.inserted} sample jobs${
          body.skipped ? ` (${body.skipped} already present)` : ""
        }.`,
      );
      router.refresh();
    } catch {
      setError("Failed to load sample jobs.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={load}
        disabled={pending}
        className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {pending ? "Loading…" : "Load sample jobs"}
      </button>
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
