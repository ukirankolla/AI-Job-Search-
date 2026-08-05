"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { csvToJobs } from "@/lib/csv";

interface ImportResult {
  inserted?: number;
  skipped?: number;
  error?: string;
}

const EXAMPLE_JSON = `[
  {
    "title": "Senior Engineer",
    "company": "Acme",
    "location": "Remote",
    "description": "Build things.",
    "url": "https://acme.com/jobs/1",
    "salary_min": 120000,
    "salary_max": 150000,
    "posted_at": "2026-01-01",
    "external_id": "acme-1",
    "source": "feed"
  }
]`;

export function JobFeedImporter() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importJobs = async (jobs: unknown[]) => {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/jobs/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs }),
      });
      const body = (await res.json().catch(() => ({}))) as ImportResult;
      if (!res.ok) {
        setError(body.error ?? "Import failed.");
        return;
      }
      setMessage(`Inserted ${body.inserted ?? 0}, skipped ${body.skipped ?? 0}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  const importJson = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError("Invalid JSON.");
      return;
    }
    const jobs = (Array.isArray(parsed) ? parsed : (parsed as { jobs?: unknown })?.jobs);
    if (!Array.isArray(jobs) || jobs.length === 0) {
      setError("Expected an array of jobs or { \"jobs\": [...] }.");
      return;
    }
    const normalized = jobs.map((j) => {
      if (!j || typeof j !== "object") return j;
      const o = { ...(j as Record<string, unknown>) };
      for (const k of ["salary_min", "salary_max"] as const) {
        const v = o[k];
        if (typeof v === "string" && v.trim() !== "") {
          const n = Number(v);
          o[k] = Number.isFinite(n) ? n : undefined;
        }
      }
      return o;
    });
    await importJobs(normalized);
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const jobs = csvToJobs(text).filter((j) => j.title);
    if (jobs.length === 0) {
      setError("No rows with a title found in the CSV.");
      return;
    }
    await importJobs(jobs);
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 p-5">
      <div>
        <h2 className="text-base font-semibold">Import a job feed</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Bulk-add jobs from a JSON array or a CSV file.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={7}
          placeholder={EXAMPLE_JSON}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <button
          type="button"
          onClick={importJson}
          disabled={pending || raw.trim().length === 0}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Importing…" : "Import JSON"}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importCsv(file);
          }}
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
        />
        <p className="text-xs text-slate-400">
          CSV columns: title*, company, location, description, url,
          salary_min, salary_max, posted_at, external_id, source
        </p>
      </div>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
